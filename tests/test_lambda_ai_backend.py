# -*- coding: utf-8 -*-
"""
FitResQ - AWS Lambda Container AI Backend Integration & Verification Test Suite
Verifies Lambda handler, Mangum ASGI adapter, API Gateway v1/v2 proxy events,
direct invocations, health endpoints, AI routing, RAG integration, and secret exclusion.
"""
import os
import sys
import json
import unittest

# Configure sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from lambda_function import handler, lambda_handler


class TestLambdaAIBackend(unittest.TestCase):

    def test_01_direct_health_action(self):
        """Test direct Lambda invocation: {'action': 'health'}"""
        event = {"action": "health"}
        res = handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body.get("status"), "ok")

    def test_02_direct_health_path(self):
        """Test direct Lambda invocation: {'path': '/health'}"""
        event = {"path": "/health"}
        res = handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body.get("status"), "ok")

    def test_03_api_gateway_v1_get_health(self):
        """Test API Gateway REST API (v1 proxy format) GET /health via Mangum"""
        event = {
            "resource": "/health",
            "path": "/health",
            "httpMethod": "GET",
            "headers": {"Accept": "application/json"},
            "multiValueHeaders": {},
            "queryStringParameters": None,
            "multiValueQueryStringParameters": None,
            "pathParameters": None,
            "stageVariables": None,
            "requestContext": {
                "resourceId": "123456",
                "resourcePath": "/health",
                "httpMethod": "GET",
                "path": "/health",
                "accountId": "123456789012",
                "protocol": "HTTP/1.1",
                "stage": "prod",
                "identity": {"sourceIp": "127.0.0.1"}
            },
            "body": None,
            "isBase64Encoded": False
        }
        res = handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body.get("status"), "ok")

    def test_04_api_gateway_v2_get_health(self):
        """Test API Gateway HTTP API (v2 proxy format) GET /health via Mangum"""
        event = {
            "version": "2.0",
            "routeKey": "GET /health",
            "rawPath": "/health",
            "rawQueryString": "",
            "headers": {"accept": "application/json"},
            "requestContext": {
                "http": {
                    "method": "GET",
                    "path": "/health",
                    "protocol": "HTTP/1.1",
                    "sourceIp": "127.0.0.1",
                    "userAgent": "test-agent"
                }
            },
            "isBase64Encoded": False
        }
        res = handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body.get("status"), "ok")

    def test_05_api_gateway_v1_post_support_policy_rag(self):
        """Test API Gateway REST API POST /api/v1/ai/support policy query"""
        event = {
            "resource": "/api/v1/ai/support",
            "path": "/api/v1/ai/support",
            "httpMethod": "POST",
            "headers": {"Content-Type": "application/json", "Accept": "application/json"},
            "requestContext": {
                "resourceId": "123456",
                "resourcePath": "/api/v1/ai/support",
                "httpMethod": "POST",
                "path": "/api/v1/ai/support",
                "identity": {"sourceIp": "127.0.0.1"}
            },
            "body": json.dumps({"message": "What is the refund policy?"}),
            "isBase64Encoded": False
        }
        res = handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertTrue(body.get("policy_used"))
        self.assertIn("Refund", body.get("response"))

    def test_06_direct_support_escalation(self):
        """Test direct Lambda invocation for supervisor escalation"""
        event = {"message": "I want to escalate my case to a supervisor"}
        res = handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body.get("intent"), "ESCALATION_REQUEST")
        self.assertIn("supervisor", body.get("response", "").lower())

    def test_07_direct_support_order_status_verified(self):
        """Test direct Lambda invocation for order status with valid order ORD-10021"""
        event = {"message": "Where is my order ORD-10021?"}
        res = handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body.get("intent"), "ORDER_STATUS")
        self.assertIn("ORD-10021", body.get("response"))

    def test_08_direct_support_order_status_unknown(self):
        """Test direct Lambda invocation for unknown order (zero fabrication guarantee)"""
        event = {"message": "Where is my order ORD-99999?"}
        res = handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body.get("intent"), "ORDER_STATUS")
        self.assertIn("account dashboard", body.get("response").lower())

    def test_09_build_context_no_secrets(self):
        """Verify that build context files do not contain real credentials or .env secrets"""
        sensitive_patterns = ["AKIA", "ASIA", "aws_secret_access_key", "PRIVATE KEY"]
        checked_files = ["Dockerfile", ".dockerignore", "lambda_function.py", "requirements.txt"]
        for fn in checked_files:
            fp = os.path.join(root_dir, fn)
            if os.path.exists(fp):
                with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    for pattern in sensitive_patterns:
                        self.assertNotIn(pattern, content, f"Pattern {pattern} found in {fn}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
