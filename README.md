# FitResQ — Intelligent Customer Support & Refund Management System

> **Enterprise-grade, AI-powered e-commerce customer support and refund lifecycle management platform built with React, FastAPI, Machine Learning, and AWS Serverless Architecture.**

---

## 1. System Overview

**FitResQ** is a unified, automated customer support and refund operations system designed to resolve customer disputes, automate refund requests, enforce strict service-level agreements (SLAs), and provide real-time conversational AI assistance.

The platform bridges modern conversational AI with robust serverless workflows. Customers can authenticate securely via **AWS Cognito (OAuth 2.0 with PKCE)**, review their real-time order history, submit verified refund requests, track support cases, and chat with an intelligent **FitResQ AI Support Agent** capable of intent classification, sentiment analysis, priority evaluation, policy retrieval (RAG), and dynamic case routing.

---

## 2. Key Features

- **Conversational AI Support Agent**: Multi-turn dialogue support with automated intent detection, sentiment scoring, and urgency-based case prioritization.
- **Retrieval-Augmented Generation (RAG)**: Policy-grounded responses retrieved dynamically from the FitResQ Refund & Return Policy via TF-IDF vector similarity.
- **Intent-Driven Routing**: Intelligent dispatcher that routes queries to live order tracking, case status lookup, refund requests, supervisor escalations, or policy explanations.
- **Zero-Fabrication Guarantees**: Strict validation prevents hallucinated orders or cases; queries for non-existent orders return authoritative warnings rather than fabricated data.
- **Secure Authentication (OAuth 2.0 + PKCE)**: Secure, secretless browser authentication using AWS Cognito Authorization Code Grant with PKCE (RFC 7636).
- **Event-Driven Refund Processing**: Decoupled asynchronous architecture leveraging AWS API Gateway, Lambda, DynamoDB, EventBridge, and SQS for SLA monitoring.
- **Automated SLA Escalation**: Dynamic calculation of resolution deadlines (24h to 120h) based on complaint severity, with auto-escalation for overdue tickets.
- **Modern Responsive UI**: Built with React 18, Vite, and Tailwind CSS, featuring glassmorphism design, real-time ticket tracking, and an integrated AI support modal.

---

## 3. AI / Machine Learning Implementation

The FitResQ AI Support subsystem provides fast, explainable, and reliable natural language processing without external cloud model latency or unpredictable outputs.

### Architecture & Models

```
               +-----------------------------------+
               |       User Customer Message       |
               +-----------------+-----------------+
                                 |
         +-----------------------+-----------------------+
         |                       |                       |
         v                       v                       v
+------------------+    +------------------+    +------------------+
| Intent Classifier|    |Sentiment Analysis|    |Priority Evaluator|
| TF-IDF + LinSVC  |    |TF-IDF + LogReg   |    |TF-IDF + LinSVC   |
| (10 Classes)     |    | (3 Classes)      |    | (3 Classes)      |
+--------+---------+    +--------+---------+    +--------+---------+
         |                       |                       |
         +-----------------------+-----------------------+
                                 |
                                 v
                     +-----------------------+
                     | Support Agent Router  |
                     +-----------+-----------+
                                 |
      +-----------------+--------+--------+------------------+
      |                 |                 |                  |
      v                 v                 v                  v
+-----------+     +-----------+     +-----------+      +-----------+
|Escalation |     |Order Track|     |Case Status|      |Policy RAG |
|Dispatcher |     |Lookup API |     |Lookup API |      |Retriever  |
+-----------+     +-----------+     +-----------+      +-----------+
```

### 1. Intent Classification (10 Classes)
Classifies user queries into granular operational intents:
- `REFUND_REQUEST`: Requesting return or monetary refund.
- `ORDER_STATUS`: Inquiring about shipping, delivery, or tracking.
- `CASE_STATUS`: Inquiring about an existing ticket or case progress.
- `ESCALATION_REQUEST`: Demanding human agent, manager, or supervisor intervention.
- `POLICY_INQUIRY`: Questions regarding returns, conditions, or store policies.
- `PAYMENT_ISSUE`: Payment failures, card deductions, UPI issues.
- `FEEDBACK`: Praise, suggestions, or general feedback.
- `CANCELLATION`: Order cancellation requests.
- `AGENT_HANDOFF`: Direct request to transfer to human support.
- `GENERAL_QUERY`: Greetings, small talk, platform questions.

* **Dataset & Balancing**: 513 balanced and augmented samples across all 10 classes with domain-specific vocabulary.
* **Accuracy & Metrics**: Test accuracy **93.20%**, Macro F1 **0.9325**.
* **Generalization**: 100% pass rate (24/24) on unseen paraphrase benchmarks, specifically ensuring zero misrouting between escalation and case status.

### 2. Sentiment Analysis (3 Classes)
Identifies emotional tone (`POSITIVE`, `NEUTRAL`, `NEGATIVE`) using Logistic Regression over n-gram TF-IDF representations.

### 3. Priority Evaluation (3 Classes)
Scores ticket severity (`LOW`, `MEDIUM`, `HIGH`) to determine SLA windows:
- **HIGH (24h SLA)**: Escalations, legal threats, repeated failures, severe payment issues.
- **MEDIUM (72h SLA)**: Damaged goods, delayed deliveries, order discrepancies.
- **LOW (120h SLA)**: General policy inquiries, routine tracking, feedback.

### 4. Policy RAG Retriever
- Indexes `refund-policy.txt` into distinct policy sections.
- Computes cosine similarity with unigram/bigram TF-IDF vector space.
- Retrieves authoritative policy clauses when confidence threshold is satisfied; provides helpful fallback when questions are out of domain.

---

## 4. System Architecture & Data Flow

```
[ Customer Browser ]
        |
        |--- (1) Authenticate (OAuth 2.0 PKCE) ---> [ AWS Cognito ]
        |                                                   |
        |<-- (2) ID/Access Tokens -------------------------+
        |
        +--- (3) Submit Refund Request ---> [ AWS API Gateway ]
        |                                           |
        |                                           v
        |                                 [ Lambda: create-refund ]
        |                                           |
        |               +---------------------------+---------------------------+
        |               |                           |                           |
        |               v                           v                           v
        |       [ DynamoDB: Orders ]        [ DynamoDB: Cases ]         [ DynamoDB: Audit ]
        |       (Validate Order ID)         (Create Case Record)        (Record Transaction)
        |                                           |
        |                                           v
        |                                 [ Amazon EventBridge ]
        |                                           |
        |                                           v
        |                                 [ AWS SQS / SLA Worker ]
        |
        +--- (4) AI Support & Chat Query ---> [ FastAPI AI Server (Port 8000) ]
                                                    |
                                                    +---> Intent / Sentiment / Priority Models
                                                    +---> Policy RAG Index
                                                    +---> Local DynamoDB / Order Verifier
```

---

## 5. AWS Services & Integration Details

| Service | Component / Table | Purpose |
| :--- | :--- | :--- |
| **AWS Cognito** | User Pool & Hosted UI | User registration, authentication, token issuance via PKCE. |
| **AWS API Gateway** | REST API (`/refund-requests`, `/user/me`) | Exposes secure endpoints backed by Cognito User Pool Authorizer. |
| **AWS Lambda** | `fitresq-create-refund-request` | Validates order ownership, generates case ID, writes to DynamoDB. |
| **AWS Lambda** | `fitresq-get-user-me` | Returns authenticated user profile and associated orders. |
| **AWS Lambda** | `fitresq-seeder-lambda` | Seeds initial catalog of demo orders and customers. |
| **Amazon DynamoDB** | `FitResQCases` | Stores support cases, current status (`OPEN`, `RESOLVED`), and priority. |
| **Amazon DynamoDB** | `FitResQOrders` | Authoritative order store for order verification and fraud prevention. |
| **Amazon DynamoDB** | `FitResQAudit` | Tamper-evident audit trail for all ticket state changes. |
| **Amazon DynamoDB** | `FitResQSLA` | Tracks SLA deadlines, response duration, and escalation flags. |
| **Amazon EventBridge** | `FitResQEvents` | Event bus dispatching `RefundRequestCreated` events. |
| **Amazon SQS** | Support & Escalation Queues | Decouples notification workers and supervisor alerts. |
| **Amazon CloudWatch** | Log Groups & Metrics | Centralized logging for Lambda functions and API Gateway. |

---

## 6. Project Structure

```
FitResQ/
+-- .env.example                     # Environment template for root and deployment
+-- .gitignore                       # Production gitignore rules
+-- README.md                        # Comprehensive system documentation
+-- refund-policy.txt                # Authoritative FitResQ refund and return policy
+-- requirements.txt                 # Root Python dependencies
¦
+-- ai/                              # AI workflow specifications (.gitkeep)
+-- docs/                            # Architectural design documents (.gitkeep)
+-- infrastructure/                  # IaC templates & cloud specifications (.gitkeep)
+-- ml/                              # Root ML documentation (.gitkeep)
+-- tests/                           # System integration test suites (.gitkeep)
¦
+-- backend/
¦   +-- package.json                 # Node.js dependencies and data scripts
¦   +-- data/                        # Sample datasets for orders and customers
¦   ¦   +-- customers.json
¦   ¦   +-- orders.json
¦   ¦   +-- refunds.json
¦   +-- dist/                        # Packaged AWS Lambda deployment artifacts
¦   ¦   +-- fitresq-create-refund-request.zip
¦   ¦   +-- fitresq-get-user-me.zip
¦   ¦   +-- fitresq-seeder-lambda.zip
¦   +-- lambda-create-refund-request/# Lambda source: Refund ticket creation
¦   ¦   +-- index.mjs
¦   ¦   +-- package.json
¦   +-- lambda-seeder/               # Lambda source: DynamoDB dataset seeder
¦   ¦   +-- index.mjs
¦   ¦   +-- package.json
¦   +-- lambda-user-me/              # Lambda source: User profile lookup
¦   ¦   +-- index.mjs
¦   ¦   +-- package.json
¦   +-- ml/                          # Machine Learning & AI Support subsystem
¦   ¦   +-- requirements.txt         # Python ML dependencies
¦   ¦   +-- agent/                   # AI Agent runtime and FastAPI server
¦   ¦   ¦   +-- predict_intent.py    # Intent classifier interface
¦   ¦   ¦   +-- predict_priority.py  # Priority evaluator interface
¦   ¦   ¦   +-- predict_sentiment.py # Sentiment classifier interface
¦   ¦   ¦   +-- server.py            # Production FastAPI server (port 8000)
¦   ¦   ¦   +-- support_agent.py     # Dialogue router and conversational agent
¦   ¦   ¦   +-- test_agent.py        # Comprehensive AI agent test suite
¦   ¦   +-- data/                    # Training datasets (CSV)
¦   ¦   ¦   +-- complaints.csv       # Intent classification corpus (513 rows)
¦   ¦   ¦   +-- priority_complaints.csv
¦   ¦   ¦   +-- sentiment_complaints.csv
¦   ¦   +-- models/                  # Serialized trained scikit-learn models
¦   ¦   ¦   +-- intent_classifier.joblib
¦   ¦   ¦   +-- priority_classifier.joblib
¦   ¦   ¦   +-- sentiment_classifier.joblib
¦   ¦   +-- rag/                     # Retrieval-Augmented Generation subsystem
¦   ¦       +-- rag_retriever.py     # TF-IDF cosine similarity retriever
¦   ¦       +-- test_rag.py          # RAG test suite
¦   +-- schema/                      # OpenAPI route definitions & DynamoDB schemas
¦   +-- scripts/                     # Seeding, generation, and deployment scripts
¦   +-- tests/                       # Backend unit and validation tests
¦
+-- frontend/
    +-- .env.example                 # Frontend Vite environment template
    +-- package.json                 # Frontend dependencies (React, Vite, Tailwind)
    +-- vite.config.js               # Vite config with API proxy
    +-- tailwind.config.js           # Tailwind CSS theme configuration
    +-- index.html                   # Application HTML entry point
    +-- src/
        +-- App.jsx                  # Main application router
        +-- main.jsx                 # React root render
        +-- components/              # UI components
        ¦   +-- AISupportModal.jsx   # Interactive AI chat modal
        ¦   +-- Header.jsx           # Global navigation header
        ¦   +-- ProtectedRoute.jsx   # Cognito auth guard
        +-- pages/                   # Application pages
        ¦   +-- Dashboard.jsx        # Customer case tracking dashboard
        ¦   +-- Home.jsx             # Landing page
        ¦   +-- Login.jsx            # Cognito PKCE callback handler
        ¦   +-- OrderHistory.jsx     # Order history and item inspection
        ¦   +-- RequestRefund.jsx    # Step-by-step refund request wizard
        +-- services/                # API and authentication services
            +-- aiService.js         # AI backend API client
            +-- api.js               # AWS API Gateway HTTP client
            +-- authService.js       # AWS Cognito PKCE authentication client
```

---

## 7. Environment Variables Reference

Create a `.env` file in the project root or configure these variables in your hosting environment:

| Variable | Scope | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend / AI | Port for FastAPI server | `8000` |
| `HOST` | Backend / AI | Host bind address | `0.0.0.0` |
| `AWS_REGION` | Backend / AWS | AWS target region | `us-east-1` |
| `VITE_API_BASE_URL` | Frontend | AWS API Gateway endpoint base | `https://your-api-id.execute-api.us-east-1.amazonaws.com` |
| `VITE_API_GATEWAY_URL` | Frontend | Direct API Gateway alias | `https://your-api-id.execute-api.us-east-1.amazonaws.com` |
| `VITE_AI_API_URL` | Frontend | AI server endpoint | `http://localhost:8000` |
| `VITE_COGNITO_USER_POOL_ID` | Frontend | Cognito User Pool ID | `us-east-1_example` |
| `VITE_COGNITO_CLIENT_ID` | Frontend | Cognito App Client ID (Public PKCE) | `exampleclientid1234567890` |
| `VITE_COGNITO_DOMAIN` | Frontend | Cognito Hosted UI domain | `https://your-domain.auth.us-east-1.amazoncognito.com` |
| `VITE_COGNITO_REDIRECT_URI` | Frontend | OAuth redirect URI | `http://localhost:3000/login` |
| `VITE_COGNITO_REGION` | Frontend | Cognito region | `us-east-1` |
| `DYNAMODB_CASES_TABLE` | Backend | DynamoDB table for cases | `FitResQCases` |
| `DYNAMODB_ORDERS_TABLE` | Backend | DynamoDB table for orders | `FitResQOrders` |
| `DYNAMODB_AUDIT_TABLE` | Backend | DynamoDB table for audit trail | `FitResQAudit` |
| `DYNAMODB_SLA_TABLE` | Backend | DynamoDB table for SLA tracking | `FitResQSLA` |
| `EVENTBRIDGE_BUS_NAME` | Backend | Amazon EventBridge custom bus | `FitResQEvents` |

---

## 8. Authentication Flow (AWS Cognito with PKCE)

FitResQ implements the **OAuth 2.0 Authorization Code Grant with Proof Key for Code Exchange (PKCE)** as specified in [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636).

1. **Initiation**: When the user clicks "Login", `authService.js` generates a cryptographically random `code_verifier` (43-128 characters) and derives the `code_challenge` using SHA-256.
2. **Redirect to Cognito**: The browser redirects to the Cognito Hosted UI with `response_type=code`, `client_id`, `redirect_uri`, `code_challenge`, and `code_challenge_method=S256`.
3. **Authorization Code**: Upon successful login, Cognito redirects back to `/login?code=...`.
4. **Token Exchange**: The frontend sends a `POST` request directly to Cognito's `/oauth2/token` endpoint containing the `code` and the plaintext `code_verifier`. Cognito validates the SHA-256 hash.
5. **Token Storage & Usage**: The issued `id_token` and `access_token` are saved to secure browser storage. All subsequent requests to AWS API Gateway and the AI Support server attach the token via `Authorization: Bearer <id_token>`.
6. **No Client Secrets**: Because the app runs in the browser, no client secret is used or stored, eliminating credential leak risks.

---

## 9. Event-Driven Refund Lifecycle

```
[ Customer Submits Refund ]
           |
           v
[ Lambda: create-refund-request ]
           |
    +------+------+
    |             |
    v             v
[ DynamoDB ]   [ EventBridge Bus: FitResQEvents ]
(Record Case)  (Event: DetailType = "RefundRequestCreated")
                      |
                      +-----------------------+
                      |                       |
                      v                       v
            [ SQS: Support Queue ]  [ SQS: Escalation Queue ]
                      |                       |
                      v                       v
            [ Email Notification ]  [ SLA Monitor Worker ]
```

1. **Submission**: User submits refund request with `orderId`, `reason`, and `description`.
2. **Order Validation**: Lambda verifies the order exists in `FitResQOrders` and belongs to the authenticated user.
3. **Record Generation**: Generates a unique Case ID (`FR-XXXXXXXX`) and stores records in `FitResQCases`, `FitResQSLA`, and `FitResQAudit`.
4. **Event Emission**: Dispatches a `RefundRequestCreated` event to Amazon EventBridge.
5. **Downstream Actions**: SQS queues ingest the event for automated email dispatch and scheduled CloudWatch alarm triggers if the ticket is not resolved within the SLA deadline.

---

## 10. Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Git**

### 1. Clone & Configure
```bash
git clone https://github.com/your-username/FitResQ.git
cd FitResQ

# Copy environment templates
cp .env.example .env
cp frontend/.env.example frontend/.env
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..

# Install Python ML dependencies
pip install -r requirements.txt
```

### 3. Run the AI Support Backend (Port 8000)
```bash
# Starts FastAPI server binding to 0.0.0.0:8000
python backend/ml/agent/server.py
```
Test health status:
```bash
curl http://127.0.0.1:8000/health
# Returns: {"status": "ok"}
```

### 4. Run the Frontend Application (Port 3000)
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 11. Testing & Verification Suite

The repository includes automated test suites covering ML models, API endpoints, and frontend builds:

### Run All AI & ML Tests
```bash
# Validates intent classification, sentiment analysis, priority evaluation, and RAG retrieval
python backend/ml/agent/test_agent.py
```

### Run Policy RAG Verification
```bash
python backend/ml/rag/test_rag.py
```

### Run Backend Integration Tests
```bash
node backend/tests/test_refund_requests.js
```

### Validate Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 12. Future Improvements

- [ ] **Infrastructure as Code (IaC)**: Add AWS CDK / Terraform templates in `infrastructure/` for automated cloud provisioning.
- [ ] **AWS App Runner / ECS Deployment**: Containerize the FastAPI AI service with Docker for auto-scaling serverless hosting.
- [ ] **Multi-Language RAG**: Expand intent training and policy RAG to support multilingual inquiries.
- [ ] **Automated CI/CD Pipeline**: GitHub Actions workflows for continuous linting, automated testing, and preview deployments.
- [ ] **Voice Support Integration**: Implement WebRTC / Amazon Transcribe for voice-enabled AI customer service.

---

## 13. Live Demo

- **Status**: Coming soon!

---

## 14. License

This project is licensed under the MIT License — see the LICENSE file for details.
