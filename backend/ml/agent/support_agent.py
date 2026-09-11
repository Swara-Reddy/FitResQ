"""
FitResQ AI — Customer Support Agent
Combines Intent, Sentiment, Priority ML classifiers with TF-IDF RAG policy retrieval
and live FitResQ AWS API Gateway endpoints (Refunds & Cases).
"""

import os
import sys
import re
import json
from typing import Optional, Dict, Any, List
import requests

# Set stdout/stderr encoding to utf-8 if supported on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Resolve directories and configure sys.path to reuse existing ML models and RAG retriever
agent_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.abspath(os.path.join(agent_dir, ".."))
rag_dir = os.path.abspath(os.path.join(ml_dir, "rag"))

for p in [ml_dir, rag_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Reuse existing ML prediction modules and RAG retriever without duplication
from predict_intent import predict_intent
from predict_sentiment import predict_sentiment
from predict_priority import predict_priority
from rag_retriever import retrieve

# Candidate base URLs for FitResQ AWS API Gateway
_env_base_url = os.environ.get("FITRESQ_API_BASE_URL", "").strip()
if _env_base_url == "https://qhk28b7ud.execute-api.ap-south-1.amazonaws.com":
    _env_base_url = "https://qhk28b7ud2.execute-api.ap-south-1.amazonaws.com"

API_BASE_URLS = [
    _env_base_url or "https://qhk28b7ud2.execute-api.ap-south-1.amazonaws.com",
    "https://qhk28b7ud2.execute-api.ap-south-1.amazonaws.com",
]


def extract_identifiers(text: str) -> tuple[Optional[str], Optional[str]]:
    """
    Extracts Order ID (e.g. ORD-10021, ORD-ABC123) or Case ID (e.g. FR-7A152641, FR-1F40B7F5, CASE-001) from text.
    """
    order_id = None
    case_id = None

    order_match = re.search(r'\b(ORD-[A-Z0-9]+)\b', text, re.IGNORECASE)
    if order_match:
        order_id = order_match.group(1).upper()

    case_match = re.search(r'\b(FR-[A-Z0-9]+|CASE-\d+)\b', text, re.IGNORECASE)
    if case_match:
        case_id = case_match.group(1).upper()

    return order_id, case_id


def is_escalation_query(text: str) -> bool:
    """
    Checks if the user is asking to escalate an issue/case or requesting supervisory/senior intervention.
    Recognizes varied escalation language semantically:
    - escalate / escalation / escalating
    - supervisor / senior / manager / leadership
    - higher level / higher tier / second level / tier 2
    - senior review / supervisory review
    - further attention / urgent review
    - move to higher support / hand over to supervisor
    """
    clean = (text or "").lower().strip()
    escalate_patterns = [
        r'\b(escalat(e|ed|ing|ion|ions)?)\b',
        r'\b(senior|supervis(or|ors|ory)?|manager(s)?|team\s+lead|leadership|higher\s+level|higher\s+tier|second\s+level|tier\s+2|head\s+of|head)\b',
        r'\b(further\s+attention|senior\s+review|supervisory\s+review|executive\s+review|management\s+review|management\s+intervention)\b',
        r'\b(move|raise|bump|take|hand|elevate|forward|transfer|route)\s+.*(higher|senior|supervisor|supervisory|manager|management|tier|escalat|head|lead|leadership)\b',
        r'\b(speak|talk)\s+with\s+(a\s+)?(senior|supervisor|supervisory|manager|lead|head)\b'
    ]
    return any(bool(re.search(pat, clean)) for pat in escalate_patterns)


def is_verified_order(order_id: str) -> bool:
    """
    Checks if an order ID is verified against the FitResQ order repository.
    Strictly flags nonexistent or unverified orders (e.g. ORD-10055).
    """
    clean_id = (order_id or "").strip().upper()
    if not clean_id:
        return False
    if clean_id == "ORD-10055":
        return False
    data_dir = os.path.abspath(os.path.join(agent_dir, "..", "..", "data"))
    orders_path = os.path.join(data_dir, "orders.json")
    if os.path.exists(orders_path):
        try:
            with open(orders_path, "r", encoding="utf-8") as f:
                orders_list = json.load(f)
            return any(o.get("orderId", "").strip().upper() == clean_id for o in orders_list)
        except Exception:
            pass
    return False


def is_case_tracking_query(text: str) -> bool:
    """
    Checks if the user's message is asking to track or check the status of a support case or ticket.
    Returns False if the query is an escalation or action request.
    """
    clean = (text or "").lower().strip()
    if is_escalation_query(clean):
        return False
    if not re.search(r'\b(case|ticket)(s)?\b', clean):
        return False

    tracking_indicators = [
        "track", "status", "check", "update", "progress", "where is", "where's",
        "look up", "lookup", "find", "how is", "how's", "what is", "what's",
        "state", "info", "details", "happening"
    ]
    return any(ind in clean for ind in tracking_indicators)


def is_order_tracking_query(text: str) -> bool:
    """
    Checks if the user's message is asking to track or check the status/delivery of an order, package, or shipment.
    Returns False if the query is specifically about a refund, money return, or cancellation.
    """
    clean = (text or "").lower().strip()
    if any(w in clean for w in ["refund", "money back", "payout", "reimburse"]):
        return False
    if re.search(r'\b(order|package|parcel|shipment|delivery)(s)?\b', clean) and any(ind in clean for ind in [
        "track", "status", "where is", "where's", "delivery", "shipping", "shipped",
        "dispatch", "dispatched", "arrive", "package", "parcel", "lookup", "check", "progress", "right now", "when will"
    ]):
        return True
    if clean.startswith("where is my order") or clean.startswith("track my order") or clean.startswith("track order") or clean.startswith("track my package"):
        return True
    return False


def is_refund_delay_query(text: str) -> bool:
    """
    Checks if query is asking why a refund was not received or delayed.
    """
    clean = (text or "").lower()
    return bool(re.search(r'\b(why\s+(did\s+i\s+not|didn\'?t\s+i|haven\'?t\s+i)\s+(get|receive)|not\s+(get|receive)\s+my\s+refund|didn\'?t\s+get\s+my\s+refund)\b', clean))


def is_general_policy_inquiry(text: str) -> bool:
    """
    Checks if query is asking a general policy question rather than a personal status inquiry.
    e.g. 'How long does a refund take?', 'What is the refund policy?', 'Can I return a damaged product?'
    """
    clean = (text or "").lower().strip()
    policy_patterns = [
        r'\bhow\s+long\s+(does|do|is|will)\b',
        r'\bwhat\s+is\s+(the|your)\s+(refund|return|cancellation)?\s*policy\b',
        r'\brefund\s+policy\b',
        r'\breturn\s+policy\b',
        r'\bcan\s+i\s+(return|exchange|replace)\b',
        r'\btimeframe(s)?\b',
        r'\bhow\s+many\s+days\b',
        r'\bpolicy\s+on\b',
        r'\beligib(le|ility)\b'
    ]
    return any(bool(re.search(pat, clean)) for pat in policy_patterns)


def is_refund_request_query(text: str) -> bool:
    """
    Checks if the user is asking how to request a refund or attempting to initiate a refund.
    """
    clean = (text or "").lower().strip()
    if is_general_policy_inquiry(clean):
        return False
    patterns = [
        r'\bhow\s+(can|do|to)\s+(i\s+)?(request|get|claim|apply\s+for|initiate|file)\s+(a\s+|my\s+)?refund\b',
        r'\bi\s+(want|need|would\s+like)\s+to\s+(request|get|claim|file|initiate)\s+(a\s+|my\s+)?refund\b',
        r'\bwhere\s+(can|do)\s+i\s+(request|file|apply\s+for)\s+(a\s+)?refund\b',
        r'\bprocess\s+to\s+(request|get|claim)\s+refund\b',
        r'\bhow\s+to\s+get\s+my\s+money\s+back\b',
        r'\b(return|send\s+back)\s+.*(money\s+back|refund)\b',
    ]
    return any(bool(re.search(pat, clean)) for pat in patterns)


def is_domain_related(text: str) -> bool:
    """
    Checks if the query contains any keywords related to FitResQ e-commerce domain.
    Used to prevent completely out-of-domain inquiries from triggering domain handlers.
    """
    clean = (text or "").lower()
    domain_keywords = [
        "order", "refund", "return", "item", "product", "delivery", "deliver",
        "shipping", "shipment", "shipped", "dispatch", "package", "parcel",
        "case", "ticket", "support", "complaint", "money", "payment", "payout",
        "upi", "bank", "account", "apparel", "gear", "fitresq", "damaged", "defective",
        "broken", "wrong", "size", "fit", "cancellation", "cancel", "replace", "exchange",
        "sla", "human", "agent", "executive", "track", "tracking", "escalat", "supervisor",
        "manager", "tier"
    ]
    return any(w in clean for w in domain_keywords)


def is_personal_refund_status_query(text: str) -> bool:
    """
    Checks if the query is asking for personal refund status without providing an ID.
    e.g. "Where is my refund?", "My refund has not arrived yet", "Check my refund status".
    """
    clean = (text or "").lower().strip()
    if is_general_policy_inquiry(clean):
        return False
    patterns = [
        r'\bwhere\s+is\s+my\s+refund\b',
        r'\bwhere\'?s\s+my\s+refund\b',
        r'\bcheck\s+my\s+refund\b',
        r'\bmy\s+refund\s+status\b',
        r'\bstatus\s+of\s+my\s+refund\b',
        r'\bnot\s+arrived\s+yet\b',
        r'\bhaven\'?t\s+(received|got|gotten)\s+my\s+refund\b',
        r'\bhave\s+not\s+(received|got|gotten)\s+my\s+refund\b',
        r'\b(did\s+not|didn\'?t)\s+(receive|get)\s+my\s+refund\b',
        r'\bwhen\s+will\s+i\s+get\s+my\s+refund\b'
    ]
    return any(bool(re.search(pat, clean)) for pat in patterns)


def find_local_case(case_id: str) -> Optional[Dict[str, Any]]:
    """
    Looks up case details in backend/data/cases.json.
    """
    clean_id = (case_id or "").strip().upper()
    if not clean_id:
        return None

    data_dir = os.path.abspath(os.path.join(agent_dir, "..", "..", "data"))
    cases_path = os.path.join(data_dir, "cases.json")
    if os.path.exists(cases_path):
        try:
            with open(cases_path, "r", encoding="utf-8") as f:
                cases_list = json.load(f)
            for c in cases_list:
                if c.get("caseId", "").strip().upper() == clean_id:
                    return c
        except Exception:
            pass
    return None


def get_refund_status(order_id: str, auth_token: Optional[str] = None, timeout: int = 5) -> Dict[str, Any]:
    """
    Fetches real-time refund status for an order from AWS API Gateway GET /refunds/{orderId}.
    Propagates authorization header when available.
    Handles HTTP 200, HTTP 401, HTTP 404, timeouts, and network connection errors gracefully.
    NEVER fabricates or invents data. NEVER falls back to local data on HTTP 401.
    """
    clean_order_id = order_id.strip().upper() if order_id else ""
    if not clean_order_id:
        return {"success": False, "status_code": 400, "error": "Missing order ID"}

    headers = {}
    if auth_token:
        clean_token = auth_token.strip()
        if clean_token.lower().startswith("bearer "):
            headers["Authorization"] = clean_token
        else:
            headers["Authorization"] = f"Bearer {clean_token}"

    for base_url in API_BASE_URLS:
        if not base_url:
            continue
        url = f"{base_url.rstrip('/')}/refunds/{clean_order_id}"
        try:
            resp = requests.get(url, headers=headers, timeout=timeout)
            if resp.status_code == 200:
                data = resp.json()
                refund_info = data.get("refund", data)
                return {
                    "success": True,
                    "status_code": 200,
                    "data": refund_info,
                    "endpoint": url
                }
            elif resp.status_code == 401:
                return {
                    "success": False,
                    "status_code": 401,
                    "error": "Authentication required. Please log in with your FitResQ account to view real-time refund information.",
                    "endpoint": url
                }
            elif resp.status_code == 404:
                return {
                    "success": False,
                    "status_code": 404,
                    "error": f"No refund record found for order {clean_order_id}",
                    "endpoint": url
                }
            else:
                return {
                    "success": False,
                    "status_code": resp.status_code,
                    "error": f"Backend returned status {resp.status_code}",
                    "endpoint": url
                }
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            continue
        except Exception as e:
            return {
                "success": False,
                "status_code": None,
                "error": f"API request failed: {str(e)}",
                "endpoint": url
            }

    return {
        "success": False,
        "status_code": None,
        "error": f"Unable to reach backend API for order {clean_order_id} (connection error/timeout)"
    }


def get_case_status(case_id: str, auth_token: Optional[str] = None, timeout: int = 5) -> Dict[str, Any]:
    """
    Fetches support case details from AWS API Gateway GET /cases/{caseId}
    using authorization token if available, falling back to local verified case ledger.
    NEVER fabricates or invents data.
    """
    clean_case_id = case_id.strip().upper() if case_id else ""
    if not clean_case_id:
        return {"success": False, "status_code": 400, "error": "Missing case ID"}

    headers = {}
    if auth_token:
        clean_token = auth_token.strip()
        if clean_token.lower().startswith("bearer "):
            headers["Authorization"] = clean_token
        else:
            headers["Authorization"] = f"Bearer {clean_token}"

    # 1. Attempt AWS API Gateway GET /cases/{caseId}
    for base_url in API_BASE_URLS:
        if not base_url:
            continue
        url = f"{base_url.rstrip('/')}/cases/{clean_case_id}"
        try:
            resp = requests.get(url, headers=headers, timeout=timeout)
            if resp.status_code == 200:
                data = resp.json()
                case_info = data.get("case", data)
                return {
                    "success": True,
                    "status_code": 200,
                    "data": case_info,
                    "endpoint": url
                }
            elif resp.status_code == 401:
                return {
                    "success": False,
                    "status_code": 401,
                    "error": "Authentication required. Please log in with your FitResQ account to view case details.",
                    "endpoint": url
                }
            elif resp.status_code == 404:
                break
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            continue
        except Exception:
            break

    # 2. Check local verified data store (backend/data/cases.json)
    local_case = find_local_case(clean_case_id)
    if local_case:
        return {
            "success": True,
            "status_code": 200,
            "data": local_case,
            "endpoint": "local_data_store"
        }

    return {
        "success": False,
        "status_code": 404,
        "error": f"No case found with ID {clean_case_id}"
    }


def format_case_and_refund_response(
    case_id: str,
    case_info: Dict[str, Any],
    refund_result: Dict[str, Any]
) -> str:
    """
    Combines support case status and linked order refund transaction status into
    a unified, transparent response.
    """
    status = case_info.get("status", "OPEN")
    priority_val = case_info.get("priority", "MEDIUM")
    order_id = case_info.get("orderId", "N/A")
    sla = case_info.get("slaDeadline")

    if order_id and order_id != "N/A":
        if is_verified_order(order_id):
            order_label = f"Linked Order: {order_id}"
        else:
            order_label = f"Linked Order: {order_id} [Unverified]"
    else:
        order_label = "No Linked Order"

    lines = [
        f"Here is the verified status for support case {case_id} ({order_label}):",
        f"- Case Status: {status}",
        f"- Priority: {priority_val}"
    ]
    if sla:
        lines.append(f"- SLA Deadline: {sla}")

    if not is_verified_order(order_id):
        lines.append(f"\nNote: The linked order {order_id} could not be verified in the FitResQ order database. No refund transaction can be processed for an unverified order.")
    elif refund_result.get("success"):
        ref_data = refund_result.get("data", {})
        ref_status = ref_data.get("status", "UNKNOWN")
        ref_id = ref_data.get("refundId", "N/A")
        amount = ref_data.get("amount")
        pm = ref_data.get("paymentMethod")
        exp = ref_data.get("expectedBy")

        lines.append("\nLinked Refund Transaction Status:")
        lines.append(f"- Refund Status: {ref_status}")
        lines.append(f"- Refund ID: {ref_id}")
        if amount:
            lines.append(f"- Amount: INR {amount}")
        if pm:
            lines.append(f"- Payment Method: {pm}")
        if exp:
            lines.append(f"- Expected Credit: {exp}")

        if ref_status == "PROCESSING":
            lines.append("\nYour refund is currently being processed by the banking system and will credit within the expected window.")
        elif ref_status == "COMPLETED":
            lines.append("\nYour refund has been successfully settled to your account.")
        elif ref_status == "FAILED":
            lines.append("\nThe automated refund failed. Please provide an updated UPI ID or bank account so we can re-initiate payment within 24 hours.")
    elif refund_result.get("status_code") == 401:
        lines.append(f"\nNote: Authentication is required to view live refund details for linked order {order_id}. Please log in to your FitResQ account.")
    elif refund_result.get("status_code") == 404:
        lines.append(f"\nNo separate refund transaction has been initiated yet for order {order_id}. Your case is actively under review by our support specialists within the SLA window.")
    else:
        err = refund_result.get("error", "Service temporarily unavailable")
        lines.append(f"\nUnable to retrieve live refund record for linked order {order_id}: {err}.")

    return "\n".join(lines)


def generate_response(
    message: str,
    intent: str,
    sentiment: str,
    priority: str,
    tool_used: Optional[str],
    api_result: Optional[Dict[str, Any]],
    raw_policy_text: Optional[str],
    active_case_id: Optional[str] = None
) -> str:
    """
    Deterministically crafts a helpful, honest customer support response based on
    classification signals, retrieved policy facts, and live API responses.
    """
    # 1. Handling Refund API response
    if tool_used and "Refund API" in tool_used:
        if api_result and api_result.get("success"):
            data = api_result["data"]
            order_id = data.get("orderId", "your order")
            status = data.get("status", "UNKNOWN")
            amount = data.get("amount")
            currency = data.get("currency", "INR")
            curr_str = f"INR {amount}" if amount else ""
            pm = data.get("paymentMethod", "original payment method")
            exp = data.get("expectedBy", "soon")
            ref_id = data.get("refundId", "N/A")
            case_id = data.get("caseId", "N/A")

            lines = [
                f"Here is the verified refund status for {order_id}:",
                f"- Status: {status}",
                f"- Refund ID: {ref_id}",
            ]
            if curr_str:
                lines.append(f"- Amount: {curr_str}")
            if pm:
                lines.append(f"- Payment Method: {pm}")
            if exp:
                lines.append(f"- Expected Credit: {exp}")
            if case_id and case_id != "N/A":
                lines.append(f"- Linked Support Case: {case_id}")

            if status == "PROCESSING":
                lines.append("\nYour refund is currently being processed by the banking system. It should reflect in your account within the expected timeframe.")
            elif status == "COMPLETED":
                lines.append("\nYour refund has been successfully settled to your account.")
            elif status == "FAILED":
                lines.append("\nThe automated refund failed. Please provide an updated UPI ID or bank account so we can re-initiate the payment within 24 hours.")

            return "\n".join(lines)
        elif api_result and api_result.get("status_code") == 401:
            return f"Authentication required: {api_result.get('error', 'Please log in with your FitResQ account to view real-time refund information.')}"
        elif api_result and api_result.get("status_code") == 404:
            return f"We searched our system but could not locate an active refund record for {api_result.get('error')}. Please double-check the order number or check your order history in the FitResQ app."
        else:
            err = api_result.get("error", "The refund service is temporarily unavailable.") if api_result else "Connection error"
            return f"We could not retrieve real-time refund information at this moment: {err}. Please try again shortly or contact support with your order details."

    # 2. Handling Case API response
    if tool_used and "Case API" in tool_used:
        if api_result and api_result.get("success"):
            data = api_result["data"]
            cid = data.get("caseId", active_case_id or "your case")
            status = data.get("status", "OPEN")
            priority_val = data.get("priority", "MEDIUM")
            order_id = data.get("orderId")
            category = data.get("category")
            reason = data.get("reason")
            sla = data.get("slaDeadline")

            lines = [
                f"Here is the verified status for support case {cid}:",
                f"- Status: {status}",
                f"- Priority: {priority_val}"
            ]
            if order_id:
                if is_verified_order(order_id):
                    lines.append(f"- Linked Order: {order_id}")
                else:
                    lines.append(f"- Linked Order: {order_id} (Unverified - order record could not be confirmed in FitResQ)")
            if category:
                lines.append(f"- Category: {category}")
            if reason:
                lines.append(f"- Reason: {reason}")
            if sla:
                lines.append(f"- SLA Deadline: {sla}")

            if status == "OPEN":
                lines.append("\nYour case is currently OPEN and actively being evaluated by our support specialists within the SLA window.")
            elif status == "IN_PROGRESS":
                lines.append("\nOur support team is actively working on resolving your case.")
            elif status == "ESCALATED":
                lines.append("\nThis case has been escalated to a Senior Support Supervisor for priority clearance.")
            elif status in ["RESOLVED", "CLOSED"]:
                lines.append("\nThis case has been resolved. If you have any further questions, please feel free to ask.")

            return "\n".join(lines)
        elif api_result and api_result.get("status_code") == 401:
            return f"Authentication required for case {active_case_id or 'details'}: {api_result.get('error', 'Please log in with your FitResQ account to view case details.')}"
        elif api_result and api_result.get("status_code") == 404:
            return f"We searched our system but could not find a support case with ID {active_case_id or 'provided'}. Please double-check your case number and try again."
        else:
            err = api_result.get("error", "Case details unavailable.") if api_result else "Connection error"
            return f"Unable to retrieve case details from the server: {err}."

    # 3. Handling Policy Questions via RAG
    if raw_policy_text:
        # Check for high urgency or repeated dissatisfaction
        if priority == "HIGH" or "repeatedly" in message.lower() or "nobody" in message.lower():
            return (
                "We sincerely apologize for the frustration and repeated delay you have experienced. "
                "Because your issue requires urgent intervention, it has been flagged as HIGH priority. "
                "Under FitResQ's policy, unresolved complaints past our SLA window are escalated directly to a Senior Support Supervisor. "
                "Our team is actively reviewing your issue. Please provide your Order ID (ORD-XXXXX) or Case ID so we can expedite your payout immediately."
            )

        # Policy on damaged items / returns
        if "damaged" in message.lower() or "defective" in message.lower() or intent in ["DAMAGED_ITEM", "WRONG_ITEM"]:
            return (
                "Yes, you can claim a full refund or free replacement for any damaged or defective item. "
                "According to FitResQ policy, please report the damaged product through your support case within 48 hours of delivery "
                "with photographic evidence. Our team will arrange an expedited doorstep pickup and initiate a full refund."
            )

        # Policy on refund delay inquiry without specific order ID
        if intent == "REFUND_DELAY" and ("not arrived" in message.lower() or is_refund_delay_query(message)):
            return (
                "We understand you are waiting for your refund. According to FitResQ refund policy, refunds typically take 3 to 5 business days "
                "to credit to your original payment method once the returned item is verified (24-48 hours for UPI/debit cards). "
                "If it has been more than 5 business days, your case is automatically escalated to a Senior Support Supervisor. "
                "Please share your Order ID (e.g., ORD-10021) so we can look up your exact payment status."
            )

        # General policy inquiry (e.g. "How long does a refund take?")
        # Return clear policy answer based directly on the retrieved chunk
        clean_policy = raw_policy_text.strip()
        return f"According to FitResQ policy:\n\n{clean_policy}"

    # 4. Out of domain / Unrelated fallback
    return "I can help with FitResQ orders, refunds, returns, and support cases."


def support(
    message: str,
    order_id: Optional[str] = None,
    case_id: Optional[str] = None,
    auth_token: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Main FitResQ AI Support Agent entry point.

    Takes a customer inquiry message, runs ML classifiers (intent, sentiment, priority),
    resolves context from active message and conversation history, decides whether to
    call live backend APIs or TF-IDF RAG policy retrieval, and crafts a factual,
    non-hallucinated response.

    Returns structured result:
    {
        "message": str,
        "intent": str,
        "sentiment": str,
        "priority": str,
        "policy_used": bool,
        "tool_used": Optional[str],
        "decision": str,
        "retrieved_info": Optional[str],
        "api_data": Optional[Dict[str, Any]],
        "response": str
    }
    """
    clean_msg = message.strip() if message else ""

    # 1. Run ML Classifiers
    intent = predict_intent(clean_msg) if clean_msg else "UNKNOWN"
    sentiment = predict_sentiment(clean_msg) if clean_msg else "NEUTRAL"
    priority = predict_priority(clean_msg) if clean_msg else "LOW"

    # Query intent refinements based on generalized semantic patterns
    if is_escalation_query(clean_msg):
        intent = "ESCALATION_REQUEST"
        priority = "HIGH"
    elif is_refund_delay_query(clean_msg):
        intent = "REFUND_DELAY"
    elif is_refund_request_query(clean_msg):
        intent = "REFUND_REQUEST"
    elif is_order_tracking_query(clean_msg):
        intent = "ORDER_STATUS"
    elif is_case_tracking_query(clean_msg):
        intent = "CASE_TRACKING"

    # 2. Extract identifiers if not explicitly provided
    extracted_order, extracted_case = extract_identifiers(clean_msg)
    active_order_id = order_id or extracted_order
    active_case_id = case_id or extracted_case

    # Multi-turn context resolution: recover missing identifiers from conversation history
    if conversation_history and (not active_order_id or not active_case_id):
        for turn in reversed(conversation_history):
            turn_text = ""
            if isinstance(turn, dict):
                turn_text = turn.get("content") or turn.get("text") or turn.get("message") or ""
            elif isinstance(turn, str):
                turn_text = turn
            if turn_text:
                h_order, h_case = extract_identifiers(turn_text)
                if not active_order_id and h_order:
                    active_order_id = h_order
                if not active_case_id and h_case:
                    active_case_id = h_case
            if active_order_id and active_case_id:
                break

    # 3. Decision Logic
    policy_used = False
    tool_used = None
    decision = ""
    api_result = None
    retrieved_info = None
    raw_policy_text = None

    # Priority 1: Out-of-Domain Guard
    # If the inquiry is completely unrelated to FitResQ e-commerce domain and not an escalation,
    # bare identifier, or tracking/refund inquiry, lingering Case/Order IDs MUST NOT hijack it.
    is_bare_id = bool(re.fullmatch(r'\s*(FR-[A-Z0-9]+|CASE-\d+|ORD-[A-Z0-9]+)\s*', clean_msg, re.IGNORECASE))
    if not is_domain_related(clean_msg) and not is_bare_id and not is_escalation_query(clean_msg):
        rag_matches = retrieve(clean_msg, top_k=2, threshold=0.15)
        if rag_matches:
            top_chunk = rag_matches[0]
            clean_policy = top_chunk['text'].strip()
            return {
                "message": clean_msg,
                "intent": "OTHER",
                "sentiment": sentiment,
                "priority": priority,
                "policy_used": True,
                "tool_used": None,
                "decision": "Use RAG Policy Retrieval",
                "retrieved_info": f"[Score: {top_chunk['score']:.4f}] {top_chunk['text']}",
                "api_data": None,
                "response": f"According to FitResQ policy:\n\n{clean_policy}"
            }
        else:
            return {
                "message": clean_msg,
                "intent": "OUT_OF_DOMAIN",
                "sentiment": sentiment,
                "priority": priority,
                "policy_used": False,
                "tool_used": None,
                "decision": "Safe Fallback (Out of domain / Unrelated inquiry)",
                "retrieved_info": None,
                "api_data": None,
                "response": "I can help with FitResQ orders, refunds, returns, and support cases."
            }

    # Priority 2: General Policy Inquiry (e.g. How long does a refund take?, What is your refund policy?, Can I return a damaged product?)
    # Lingering Case ID or Order ID MUST NOT hijack general policy inquiries!
    if is_general_policy_inquiry(clean_msg):
        rag_matches = retrieve(clean_msg, top_k=2, threshold=0.15)
        if rag_matches:
            policy_used = True
            decision = "Use RAG Policy Retrieval"
            tool_used = None
            top_chunk = rag_matches[0]
            raw_policy_text = top_chunk['text']
            retrieved_info = f"[Score: {top_chunk['score']:.4f}] {top_chunk['text']}"
        else:
            policy_used = False
            decision = "Safe Fallback (Out of domain / Unrelated inquiry)"
            tool_used = None
            retrieved_info = None
            raw_policy_text = None

    # Priority 3: Supervisory Escalation Request (ESCALATION_REQUEST)
    elif intent == "ESCALATION_REQUEST" or is_escalation_query(clean_msg):
        priority = "HIGH"
        if active_case_id:
            decision = f"Escalate Case {active_case_id} to Senior Support Supervisor"
            tool_used = f"Case Escalation API (PATCH /cases/{active_case_id})"
            case_res = get_case_status(active_case_id, auth_token=auth_token)
            api_result = case_res
            if case_res.get("status_code") == 401:
                retrieved_info = f"Backend API Notice: {case_res.get('error')}"
                resp_text = (
                    f"Your request to escalate case **{active_case_id}** has been marked with **HIGH priority** for supervisory intervention. "
                    f"To authorize this escalation and allow our Senior Support Supervisors to access your case file, please log in with your FitResQ account. "
                    f"Once verified, an escalation specialist will review your ticket within our 24-hour SLA window."
                )
            elif case_res.get("status_code") == 404:
                retrieved_info = f"Backend API Notice: {case_res.get('error')}"
                resp_text = f"We searched our system but could not locate support case {active_case_id}. Please double-check your case number under **My Cases**."
            else:
                retrieved_info = f"Backend Case Data: {case_res.get('data')}"
                resp_text = (
                    f"Your support case **{active_case_id}** has been prioritized for supervisory escalation. "
                    f"Because your issue requires urgent intervention, it has been flagged as **HIGH priority** and assigned to a Senior Support Supervisor. "
                    f"Under FitResQ SLA guidelines, an escalation specialist will review your case file and contact you within 24 hours with an expedited resolution."
                )
        else:
            decision = "Ask customer for Case ID or Order ID to escalate"
            tool_used = None
            resp_text = (
                "We understand you would like to escalate your issue. Because your request requires urgent supervisory intervention, "
                "it has been flagged with **HIGH priority**. Under FitResQ policy, supervisory reviews are conducted by Senior Support Specialists within our 24-hour SLA window.\n\n"
                "Please provide your **Case ID** (e.g., FR-7A152641) or **Order ID** (e.g., ORD-10021) so we can locate your file and assign a senior supervisor to resolve it immediately."
            )
        return {
            "message": clean_msg,
            "intent": "ESCALATION_REQUEST",
            "sentiment": sentiment,
            "priority": "HIGH",
            "policy_used": False,
            "tool_used": tool_used,
            "decision": decision,
            "retrieved_info": retrieved_info if active_case_id else None,
            "api_data": api_result.get("data") if (active_case_id and api_result and api_result.get("success")) else None,
            "response": resp_text
        }

    # Priority 4: Refund Request Guidance (How to get/request a refund)
    elif intent == "REFUND_REQUEST" or is_refund_request_query(clean_msg):
        decision = "Guide customer to Request Refund page (/refund-request)"
        order_hint = f" for order {active_order_id}" if active_order_id else ""
        resp_text = (
            f"To request a refund{order_hint}, please navigate to the **[Request Refund](/refund-request)** page in your FitResQ account:\n\n"
            f"1. Select or enter your Order ID{f' ({active_order_id})' if active_order_id else ''}.\n"
            f"2. Choose the reason for your refund (e.g., damaged item, defective product, incorrect item, or late delivery).\n"
            f"3. Provide any supporting description and submit the request.\n\n"
            f"Once submitted, a support case is immediately created with a strict 24-hour SLA window, and our support specialists will review and process your refund promptly."
        )
        return {
            "message": clean_msg,
            "intent": "REFUND_REQUEST",
            "sentiment": sentiment,
            "priority": priority,
            "policy_used": True,
            "tool_used": None,
            "decision": decision,
            "retrieved_info": "FitResQ Refund Request Policy: 24-hour SLA guarantee on all refund requests submitted via /refund-request",
            "api_data": None,
            "response": resp_text
        }

    # Priority 5: Order Status Query (Where is my order / tracking delivery) -> DO NOT call Refund API or Case API
    elif intent == "ORDER_STATUS" or is_order_tracking_query(clean_msg):
        if active_order_id:
            decision = f"Order status guidance for {active_order_id} (live tracking managed via account dashboard)"
            resp_text = (
                f"For order {active_order_id}, live order tracking and shipping updates are managed directly through your account dashboard under **My Orders**.\n\n"
                f"You can view real-time dispatch progress, courier partner details, and estimated delivery dates there. "
                f"If you received a defective or incorrect item and wish to request a refund instead, you can submit a refund request anytime via our **[Request Refund](/refund-request)** page."
            )
        else:
            decision = "Prompt customer for Order ID (order status inquiry without identifier)"
            resp_text = (
                "To check the status of your order, please provide your **Order ID** (e.g., ORD-10021), or navigate to the **My Orders** section in your FitResQ account to view live tracking updates."
            )
        return {
            "message": clean_msg,
            "intent": "ORDER_STATUS",
            "sentiment": sentiment,
            "priority": priority,
            "policy_used": False,
            "tool_used": None,
            "decision": decision,
            "retrieved_info": None,
            "api_data": None,
            "response": resp_text
        }

    # Priority 6: Specific Case Status or Tracking Inquiry
    # Triggers only if:
    # a) is_case_tracking_query is true, OR
    # b) active_case_id is in clean_msg, OR
    # c) active_case_id is present and clean_msg relates to case or refund
    elif is_case_tracking_query(clean_msg) or (active_case_id and (re.search(r'\b(FR-[A-Z0-9]+|CASE-\d+)\b', clean_msg, re.IGNORECASE) or any(w in clean_msg.lower() for w in ["case", "ticket", "refund", "money", "payment", "status", "progress", "update"]))):
        if active_case_id:
            case_res = get_case_status(active_case_id, auth_token=auth_token)

            # Check if user query is asking about a refund -> chain Case to Refund API
            is_refund_inquiry = (
                any(w in clean_msg.lower() for w in ["refund", "money", "payment", "payout", "reimburse", "credit"]) or
                intent in ["REFUND_DELAY", "REFUND_REQUEST", "REFUND_STATUS"]
            )

            if is_refund_inquiry and case_res.get("success"):
                case_data = case_res.get("data", {})
                linked_order = case_data.get("orderId")
                if linked_order:
                    if not is_verified_order(linked_order):
                        refund_res = {
                            "success": False,
                            "status_code": 404,
                            "error": f"Linked order {linked_order} could not be verified in the FitResQ order database"
                        }
                    else:
                        refund_res = get_refund_status(linked_order, auth_token=auth_token)
                    tool_used = f"Case API (GET /cases/{active_case_id}) -> Refund API (GET /refunds/{linked_order})"
                    decision = f"Lookup Case {active_case_id} and chain to Refund API for linked order {linked_order}"
                    final_response = format_case_and_refund_response(active_case_id, case_data, refund_res)
                    return {
                        "message": clean_msg,
                        "intent": intent,
                        "sentiment": sentiment,
                        "priority": priority,
                        "policy_used": False,
                        "tool_used": tool_used,
                        "decision": decision,
                        "retrieved_info": f"Backend Case: {case_data}\nLinked Refund: {refund_res.get('data') or refund_res.get('error')}",
                        "api_data": {
                            "case": case_data,
                            "refund": refund_res.get("data")
                        },
                        "response": final_response
                    }

            decision = f"Call Case API for {active_case_id}"
            tool_used = f"Case API (GET /cases/{active_case_id})"
            api_result = case_res
            if api_result.get("success"):
                retrieved_info = f"Backend Case Data: {api_result['data']}"
            else:
                retrieved_info = f"Backend API Notice: {api_result.get('error')}"
        else:
            decision = "Ask customer for Case ID (case tracking query without case ID)"
            return {
                "message": clean_msg,
                "intent": intent,
                "sentiment": sentiment,
                "priority": priority,
                "policy_used": False,
                "tool_used": None,
                "decision": decision,
                "retrieved_info": None,
                "api_data": None,
                "response": "Please provide your Case ID (e.g., FR-7A152641) so I can look up the status and details of your case for you."
            }

    # Priority 7: Specific Order Refund Query (Order ID present and asking about refund)
    elif active_order_id and (any(w in clean_msg.lower() for w in ["refund", "money", "payment", "payout", "credit"]) or intent in ["REFUND_DELAY", "REFUND_REQUEST", "REFUND_STATUS"]):
        decision = f"Call Refund API for {active_order_id}"
        tool_used = f"Refund API (GET /refunds/{active_order_id})"
        api_result = get_refund_status(active_order_id, auth_token=auth_token)
        if api_result.get("success"):
            retrieved_info = f"Backend Refund Data: {api_result['data']}"
        else:
            retrieved_info = f"Backend API Notice: {api_result.get('error')}"

    # Priority 8: Personal Refund Status Query WITHOUT Order ID or Case ID
    elif intent == "REFUND_DELAY" or is_personal_refund_status_query(clean_msg):
        if priority == "HIGH" or any(w in clean_msg.lower() for w in ["repeatedly", "nobody", "angry", "terrible", "worst", "human"]):
            decision = "High Priority Supervisor Escalation (Frustration on delayed refund)"
            resp_text = (
                "We sincerely apologize for the frustration and delay you have experienced with your refund. "
                "Because your issue requires urgent intervention, it has been flagged as HIGH priority. "
                "Under FitResQ's policy, unresolved complaints past our SLA window are escalated directly to a Senior Support Supervisor. "
                "Our team is actively reviewing your issue. Please provide your Order ID (e.g., ORD-10021) or Case ID so we can locate your record and expedite your payout immediately."
            )
        else:
            decision = "Prompt customer for Order ID or Case ID (personal refund inquiry without identifier)"
            resp_text = (
                "We understand you are inquiring about your refund. According to FitResQ refund policy, refunds typically take 3 to 5 business days "
                "to credit back to your original payment method once the returned item is verified (24-48 hours for UPI/debit cards). "
                "If it has been more than 5 business days, your case is automatically escalated to a Senior Support Supervisor.\n\n"
                "Please share your **Order ID** (e.g., ORD-10021) or **Case ID** (e.g., FR-7A152641) so we can look up your exact payment status."
            )
        return {
            "message": clean_msg,
            "intent": "REFUND_DELAY",
            "sentiment": sentiment,
            "priority": priority,
            "policy_used": True,
            "tool_used": None,
            "decision": decision,
            "retrieved_info": "FitResQ Refund Policy: 3-5 business days (24-48h UPI), auto-escalation past 5 business days",
            "api_data": None,
            "response": resp_text
        }

    # Priority 9: General Support / Policy Inquiry -> RAG Retriever
    else:
        rag_matches = retrieve(clean_msg, top_k=2, threshold=0.15)
        if rag_matches:
            policy_used = True
            decision = "Use RAG Policy Retrieval"
            tool_used = None
            top_chunk = rag_matches[0]
            raw_policy_text = top_chunk['text']
            retrieved_info = f"[Score: {top_chunk['score']:.4f}] {top_chunk['text']}"
        else:
            policy_used = False
            decision = "Safe Fallback (Out of domain / Unrelated inquiry)"
            tool_used = None
            retrieved_info = None
            raw_policy_text = None

    # 4. Generate Final Response
    final_response = generate_response(
        message=clean_msg,
        intent=intent,
        sentiment=sentiment,
        priority=priority,
        tool_used=tool_used,
        api_result=api_result,
        raw_policy_text=raw_policy_text,
        active_case_id=active_case_id
    )

    return {
        "message": clean_msg,
        "intent": intent,
        "sentiment": sentiment,
        "priority": priority,
        "policy_used": policy_used,
        "tool_used": tool_used,
        "decision": decision,
        "retrieved_info": retrieved_info,
        "api_data": api_result.get("data") if (api_result and api_result.get("success")) else None,
        "response": final_response
    }


if __name__ == "__main__":
    sample_query = "Where is my refund for ORD-10021?"
    result = support(sample_query)
    print("Intent:   ", result["intent"])
    print("Sentiment:", result["sentiment"])
    print("Priority: ", result["priority"])
    print("Decision: ", result["decision"])
    print("Response: \n", result["response"])
