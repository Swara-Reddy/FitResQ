"""
AWS Lambda function entrypoint for FitResQ AI Support Backend.
Forwards invocations to the FastAPI/Mangum handler in backend/ml/agent/server.py.
"""
import os
import sys

# Ensure backend/ml/agent and backend/ml are in sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.join(_current_dir, "backend", "ml", "agent")
_ml_dir = os.path.join(_current_dir, "backend", "ml")

for _p in [_current_dir, _ml_dir, _agent_dir]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from server import app, handler, lambda_handler

__all__ = ["app", "handler", "lambda_handler"]
