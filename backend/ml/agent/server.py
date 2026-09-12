"""
FitResQ AI — Support Agent & Refund Request HTTP API Server
FastAPI server exposing:
- POST /api/v1/ai/support: AI customer support inquiry handling
- POST /refund-requests: Customer refund request submission with SLA & audit logging
"""

import sys
import os
import json
import uuid
import subprocess
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure agent directory and ml root are in sys.path
agent_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.abspath(os.path.join(agent_dir, ".."))
backend_dir = os.path.abspath(os.path.join(ml_dir, ".."))
data_dir = os.path.join(backend_dir, "data")
scripts_dir = os.path.join(backend_dir, "scripts")

for p in [agent_dir, ml_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from support_agent import support

try:
    from predict_priority import predict_priority
except Exception:
    predict_priority = None

app = FastAPI(title="FitResQ Backend API Server", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SupportRequest(BaseModel):
    message: str
    orderId: Optional[str] = None
    caseId: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = None


class RefundRequestPayload(BaseModel):
    orderId: Optional[str] = None
    reason: Optional[str] = None
    description: Optional[str] = ""


def load_orders() -> list:
    orders_file = os.path.join(data_dir, "orders.json")
    if os.path.exists(orders_file):
        try:
            with open(orders_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[Orders] Error loading orders.json: {e}")
    return []


def find_order(order_id: str) -> Optional[dict]:
    clean_id = (order_id or "").strip().upper()
    orders = load_orders()
    for o in orders:
        if o.get("orderId", "").strip().upper() == clean_id:
            return o
    return None


def append_json_record(filename: str, record: dict):
    os.makedirs(data_dir, exist_ok=True)
    filepath = os.path.join(data_dir, filename)
    records = []
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                records = json.load(f)
        except Exception:
            records = []
    records.insert(0, record)
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)
    except Exception as e:
        print(f"[Storage] Error writing to {filename}: {e}")


def sync_to_dynamodb_background(case_record: dict, sla_record: dict, audit_record: dict):
    sync_script = os.path.join(scripts_dir, "sync-dynamodb-record.js")
    if os.path.exists(sync_script):
        payload = json.dumps({
            "caseRecord": case_record,
            "slaRecord": sla_record,
            "auditRecord": audit_record
        })
        try:
            # Run node sync asynchronously without blocking
            subprocess.Popen(
                ["node", sync_script, payload],
                cwd=backend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
        except Exception as e:
            print(f"[DynamoDB Sync] Background process notice: {e}")


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/v1/ai/support")
def ai_support(req: SupportRequest, request: Request):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    auth_token = request.headers.get("Authorization")

    result = support(
        message=req.message,
        order_id=req.orderId,
        case_id=req.caseId,
        auth_token=auth_token,
        conversation_history=req.history
    )

    raw_tool = result.get("tool_used")
    tool_formatted = None
    if raw_tool:
        if "Case API" in raw_tool and "Refund API" in raw_tool:
            tool_formatted = "case_and_refund_api"
        elif "Refund API" in raw_tool:
            tool_formatted = "refund_api"
        elif "Case API" in raw_tool:
            tool_formatted = "case_api"
        else:
            tool_formatted = raw_tool

    return {
        "message": result["message"],
        "intent": result["intent"],
        "sentiment": result["sentiment"],
        "priority": result["priority"],
        "policy_used": result["policy_used"],
        "tool_used": tool_formatted,
        "tool_details": raw_tool,
        "decision": result.get("decision"),
        "retrieved_info": result.get("retrieved_info"),
        "api_data": result.get("api_data"),
        "response": result["response"]
    }


@app.post("/refund-requests")
def create_refund_request(req: RefundRequestPayload):
    # 1. Validate request fields
    order_id = (req.orderId or "").strip().upper()
    if not order_id:
        raise HTTPException(status_code=400, detail="Order ID is required.")

    reason = (req.reason or "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Refund reason is required.")

    description = (req.description or "").strip()

    # 2. Verify order exists against order dataset
    order = find_order(order_id)
    if not order:
        raise HTTPException(
            status_code=404,
            detail=f"Order '{order_id}' does not exist in the FitResQ system. Please verify your order number."
        )

    user_id = order.get("userId", "CUS-001")

    # 3. Generate unique identifiers
    case_id = f"FR-{uuid.uuid4().hex[:8].upper()}"
    audit_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"

    # 4. Predict priority using ML model or fallback heuristic
    text_for_priority = f"{reason}. {description}".strip()
    if predict_priority:
        try:
            priority = predict_priority(text_for_priority)
        except Exception:
            priority = "MEDIUM"
    else:
        priority = "HIGH" if any(w in reason.lower() for w in ["damage", "defect", "broken", "wrong", "urgent"]) else "MEDIUM"

    # 5. Calculate Timestamps and Configurable SLA Deadline
    now_utc = datetime.now(timezone.utc)
    created_at_iso = now_utc.isoformat()

    # SLA duration configurable via environment variable (default: 24.0 hours)
    try:
        sla_hours = float(os.environ.get("REFUND_REQUEST_SLA_HOURS", "24"))
    except ValueError:
        sla_hours = 24.0

    sla_deadline = now_utc + timedelta(hours=sla_hours)
    sla_deadline_iso = sla_deadline.isoformat()

    # 6. FitResQCases record
    case_record = {
        "caseId": case_id,
        "userId": user_id,
        "orderId": order_id,
        "category": "REFUND_REQUEST",
        "reason": reason,
        "description": description,
        "status": "OPEN",
        "priority": priority,
        "sentiment": "NEUTRAL",
        "escalationLevel": "0",
        "slaDeadline": sla_deadline_iso,
        "createdAt": created_at_iso,
        "updatedAt": created_at_iso,
    }

    # 7. FitResQSLA record
    sla_record = {
        "caseId": case_id,
        "orderId": order_id,
        "userId": user_id,
        "deadline": sla_deadline_iso,
        "createdAt": created_at_iso,
        "durationHours": sla_hours,
        "status": "ACTIVE",
        "escalationLevel": "0",
        "breached": False,
    }

    # 8. FitResQAudit record
    audit_record = {
        "auditId": audit_id,
        "eventType": "REFUND_REQUEST_CREATED",
        "actorType": "CUSTOMER",
        "caseId": case_id,
        "orderId": order_id,
        "userId": user_id,
        "timestamp": created_at_iso,
        "details": {
            "reason": reason,
            "description": description,
            "slaDeadline": sla_deadline_iso,
            "priority": priority,
            "durationHours": sla_hours,
        },
    }

    # 9. Persist records to local ledgers (cases.json, sla.json, audit.json)
    append_json_record("cases.json", case_record)
    append_json_record("sla.json", sla_record)
    append_json_record("audit.json", audit_record)

    # 10. Background sync to AWS DynamoDB if credentials are configured
    sync_to_dynamodb_background(case_record, sla_record, audit_record)

    # 11. Return customer confirmation
    return {
        "success": True,
        "caseId": case_id,
        "orderId": order_id,
        "status": "OPEN",
        "priority": priority,
        "slaDeadline": sla_deadline_iso,
        "durationHours": sla_hours,
        "createdAt": created_at_iso,
        "message": "Refund request submitted successfully. A support specialist will review your request within the SLA window."
    }


# ----------------------------------------------------
# AWS Lambda Handler & Mangum ASGI Adapter
# ----------------------------------------------------
try:
    from mangum import Mangum
    _mangum_handler = Mangum(app)
except Exception:
    _mangum_handler = None


def lambda_handler(event, context=None):
    """
    AWS Lambda entrypoint supporting both API Gateway proxy events and direct invocations.
    """
    if not isinstance(event, dict):
        if _mangum_handler:
            return _mangum_handler(event, context)
        return {"statusCode": 400, "body": "Invalid event format"}

    # 1. API Gateway / ALB / HTTP proxy event -> route through Mangum to FastAPI
    if any(k in event for k in ("httpMethod", "requestContext", "rawPath", "version")):
        if _mangum_handler:
            return _mangum_handler(event, context)

    # 2. Direct invocation health check: {"action": "health"} or {"path": "/health"}
    if event.get("action") == "health" or event.get("path") == "/health":
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"status": "ok"})
        }

    # 3. Direct AI support payload: {"message": "..."}
    if "message" in event:
        auth_header = None
        if isinstance(event.get("headers"), dict):
            auth_header = event["headers"].get("Authorization") or event["headers"].get("authorization")

        result = support(
            message=event.get("message", ""),
            order_id=event.get("orderId"),
            case_id=event.get("caseId"),
            auth_token=auth_header,
            conversation_history=event.get("history")
        )
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "message": result["message"],
                "intent": result["intent"],
                "sentiment": result["sentiment"],
                "priority": result["priority"],
                "policy_used": result["policy_used"],
                "tool_used": result.get("tool_used"),
                "tool_details": result.get("tool_details") or result.get("tool_used"),
                "decision": result.get("decision"),
                "retrieved_info": result.get("retrieved_info"),
                "api_data": result.get("api_data"),
                "response": result["response"]
            })
        }

    # 4. Fallback to Mangum
    if _mangum_handler:
        return _mangum_handler(event, context)

    return {
        "statusCode": 400,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"error": "Unsupported event format"})
    }

# Standard handler alias
handler = lambda_handler


if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    print(f"Starting FitResQ API Server on {host}:{port}...")
    uvicorn.run(app, host=host, port=port, log_level="info")

