FROM public.ecr.aws/lambda/python:3.12

# Set Lambda task root working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Install AI/FastAPI Python dependencies
COPY backend/ml/requirements.txt ${LAMBDA_TASK_ROOT}/requirements.txt
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Copy policy document for RAG retriever
COPY refund-policy.txt ${LAMBDA_TASK_ROOT}/refund-policy.txt

# Copy reference order/case/refund datasets
COPY backend/data/ ${LAMBDA_TASK_ROOT}/backend/data/

# Copy ML assets: training data, trained models, RAG engine, inference scripts
COPY backend/ml/data/ ${LAMBDA_TASK_ROOT}/backend/ml/data/
COPY backend/ml/models/ ${LAMBDA_TASK_ROOT}/backend/ml/models/
COPY backend/ml/rag/ ${LAMBDA_TASK_ROOT}/backend/ml/rag/
COPY backend/ml/predict_intent.py ${LAMBDA_TASK_ROOT}/backend/ml/predict_intent.py
COPY backend/ml/predict_priority.py ${LAMBDA_TASK_ROOT}/backend/ml/predict_priority.py
COPY backend/ml/predict_sentiment.py ${LAMBDA_TASK_ROOT}/backend/ml/predict_sentiment.py
COPY backend/ml/agent/support_agent.py ${LAMBDA_TASK_ROOT}/backend/ml/agent/support_agent.py
COPY backend/ml/agent/server.py ${LAMBDA_TASK_ROOT}/backend/ml/agent/server.py

# Copy root Lambda entrypoint
COPY lambda_function.py ${LAMBDA_TASK_ROOT}/lambda_function.py

# Set AWS Lambda handler CMD
CMD [ "lambda_function.handler" ]
