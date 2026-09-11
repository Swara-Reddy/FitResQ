#!/usr/bin/env bash
# FitResQ - AWS Deployment Script for GET /users/me
# For AWS CloudShell or bash terminal
set -e

REGION="ap-south-1"
API_ID="qhk28b7ud2"
FUNCTION_NAME="FitResQGetUserMe"
ZIP_PATH="backend/dist/fitresq-get-user-me.zip"

echo "=================================================="
echo "FitResQ: Deploying GET /users/me to AWS API Gateway"
echo "=================================================="

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $ACCOUNT_ID"

# 1. Create or Update Lambda Function
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "Updating existing Lambda function code..."
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_PATH" \
    --region "$REGION"
else
  echo "Creating new Lambda function $FUNCTION_NAME..."
  ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/service-role/FitResQ-Lambda-Role"
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs20.x \
    --role "$ROLE_ARN" \
    --handler index.handler \
    --zip-file "fileb://$ZIP_PATH" \
    --environment "Variables={AWS_REGION=$REGION,USERS_TABLE=FitResQUsers}" \
    --region "$REGION"
fi

LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}"

# 2. Find Authorizer ID
AUTHORIZER_ID=$(aws apigatewayv2 get-authorizers --api-id "$API_ID" --region "$REGION" \
  --query "Items[?Name=='FitResQCognitoAuth'].AuthorizerId" --output text)

echo "FitResQCognitoAuth Authorizer ID: $AUTHORIZER_ID"

# 3. Create or Get Integration
INTEGRATION_ID=$(aws apigatewayv2 get-integrations --api-id "$API_ID" --region "$REGION" \
  --query "Items[?contains(IntegrationUri, '$FUNCTION_NAME')].IntegrationId" --output text)

if [ -z "$INTEGRATION_ID" ] || [ "$INTEGRATION_ID" = "None" ]; then
  INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id "$API_ID" \
    --integration-type AWS_PROXY \
    --integration-uri "$LAMBDA_ARN" \
    --payload-format-version "2.0" \
    --region "$REGION" \
    --query "IntegrationId" --output text)
  echo "Created Integration ID: $INTEGRATION_ID"
else
  echo "Existing Integration ID: $INTEGRATION_ID"
fi

# 4. Grant invoke permission
aws lambda add-permission \
  --function-name "$FUNCTION_NAME" \
  --statement-id "apigateway-get-user-me" \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*/users/me" \
  --region "$REGION" >/dev/null 2>&1 || true

# 5. Create or Update Route
ROUTE_ID=$(aws apigatewayv2 get-routes --api-id "$API_ID" --region "$REGION" \
  --query "Items[?RouteKey=='GET /users/me'].RouteId" --output text)

if [ -n "$ROUTE_ID" ] && [ "$ROUTE_ID" != "None" ]; then
  echo "Updating existing route..."
  aws apigatewayv2 update-route \
    --api-id "$API_ID" \
    --route-id "$ROUTE_ID" \
    --target "integrations/$INTEGRATION_ID" \
    --authorization-type JWT \
    --authorizer-id "$AUTHORIZER_ID" \
    --region "$REGION"
else
  echo "Creating new route GET /users/me..."
  aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key "GET /users/me" \
    --target "integrations/$INTEGRATION_ID" \
    --authorization-type JWT \
    --authorizer-id "$AUTHORIZER_ID" \
    --region "$REGION"
fi

echo ""
echo "=================================================="
echo "DEPLOYMENT COMPLETE & VERIFIED"
echo "Endpoint: https://${API_ID}.execute-api.${REGION}.amazonaws.com/users/me"
echo "=================================================="
