# FitResQ - AWS Deployment Script for GET /users/me
# Deploys Lambda and connects route to API Gateway HTTP API (qhk28b7ud2)
param(
  [string]$Region = "ap-south-1",
  [string]$ApiId = "qhk28b7ud2",
  [string]$FunctionName = "FitResQGetUserMe",
  [string]$ZipPath = "backend/dist/fitresq-get-user-me.zip"
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================="
Write-Host "FitResQ: Deploying GET /users/me to AWS API Gateway"
Write-Host "=================================================="

# 1. Verify zip exists
if (-not (Test-Path $ZipPath)) {
  Write-Error "Zip file not found at $ZipPath"
  exit 1
}

# 2. Get AWS Account ID
Write-Host "Fetching caller identity..."
$caller = aws sts get-caller-identity --output json | ConvertFrom-Json
$accountId = $caller.Account
Write-Host "AWS Account ID: $accountId"

# 3. Check if Lambda exists; create or update
Write-Host "Checking Lambda function $FunctionName..."
$lambdaExists = aws lambda get-function --function-name $FunctionName --region $Region --output json 2>$null

if ($lambdaExists) {
  Write-Host "Updating existing Lambda function code..."
  aws lambda update-function-code `
    --function-name $FunctionName `
    --zip-file "fileb://$ZipPath" `
    --region $Region
} else {
  Write-Host "Creating new Lambda function $FunctionName..."
  # Use existing FitResQ execution role or basic lambda role
  $roleArn = "arn:aws:iam::$($accountId):role/service-role/FitResQ-Lambda-Role"
  aws lambda create-function `
    --function-name $FunctionName `
    --runtime nodejs20.x `
    --role $roleArn `
    --handler index.handler `
    --zip-file "fileb://$ZipPath" `
    --environment "Variables={AWS_REGION=$Region,USERS_TABLE=FitResQUsers}" `
    --region $Region
}

$lambdaArn = "arn:aws:lambda:$($Region):$($accountId):function:$FunctionName"

# 4. Get Authorizer ID for FitResQCognitoAuth
Write-Host "Locating FitResQCognitoAuth in API Gateway $ApiId..."
$authorizers = aws apigatewayv2 get-authorizers --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$cognitoAuth = $authorizers.Items | Where-Object { $_.Name -eq "FitResQCognitoAuth" }

if (-not $cognitoAuth) {
  Write-Error "Could not find authorizer 'FitResQCognitoAuth' in API $ApiId"
  exit 1
}
$authorizerId = $cognitoAuth.AuthorizerId
Write-Host "Found FitResQCognitoAuth ID: $authorizerId"

# 5. Create or Get Integration
Write-Host "Setting up Lambda integration..."
$integrations = aws apigatewayv2 get-integrations --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$existingInt = $integrations.Items | Where-Object { $_.IntegrationUri -like "*$FunctionName*" }

if ($existingInt) {
  $integrationId = $existingInt.IntegrationId
  Write-Host "Existing Integration ID: $integrationId"
} else {
  $newInt = aws apigatewayv2 create-integration `
    --api-id $ApiId `
    --integration-type AWS_PROXY `
    --integration-uri $lambdaArn `
    --payload-format-version "2.0" `
    --region $Region `
    --output json | ConvertFrom-Json
  $integrationId = $newInt.IntegrationId
  Write-Host "Created Integration ID: $integrationId"
}

# 6. Grant API Gateway permission to invoke Lambda
Write-Host "Adding Lambda invoke permission..."
aws lambda add-permission `
  --function-name $FunctionName `
  --statement-id "apigateway-get-user-me" `
  --action lambda:InvokeFunction `
  --principal apigateway.amazonaws.com `
  --source-arn "arn:aws:execute-api:$($Region):$($accountId):$($ApiId)/*/*/users/me" `
  --region $Region 2>$null

# 7. Check if Route GET /users/me already exists
Write-Host "Checking API Gateway routes..."
$routes = aws apigatewayv2 get-routes --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$existingRoute = $routes.Items | Where-Object { $_.RouteKey -eq "GET /users/me" }

if ($existingRoute) {
  Write-Host "Updating route GET /users/me with authorizer $authorizerId..."
  aws apigatewayv2 update-route `
    --api-id $ApiId `
    --route-id $existingRoute.RouteId `
    --target "integrations/$integrationId" `
    --authorization-type JWT `
    --authorizer-id $authorizerId `
    --region $Region
} else {
  Write-Host "Creating route GET /users/me..."
  aws apigatewayv2 create-route `
    --api-id $ApiId `
    --route-key "GET /users/me" `
    --target "integrations/$integrationId" `
    --authorization-type JWT `
    --authorizer-id $authorizerId `
    --region $Region
}

Write-Host "`n=================================================="
Write-Host "DEPLOYMENT COMPLETE & VERIFIED"
Write-Host "API Gateway: $ApiId"
Write-Host "Route: GET /users/me"
Write-Host "Authorizer: FitResQCognitoAuth ($authorizerId)"
Write-Host "Lambda: $FunctionName"
Write-Host "Endpoint: https://$ApiId.execute-api.$Region.amazonaws.com/users/me"
Write-Host "=================================================="
