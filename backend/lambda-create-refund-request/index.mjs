/**
 * FitResQ Backend — POST /refund-requests Lambda Handler
 *
 * Persists customer refund requests directly into AWS DynamoDB in ap-south-1:
 * 1. Validates order existence in FitResQOrders (or falls back to linked/authenticated customer).
 * 2. Generates unique Case ID (e.g. FR-XXXXXXXX) and Audit ID.
 * 3. Dynamically assigns priority based on customer reason/description.
 * 4. Calculates 24.0-hour target SLA resolution deadline.
 * 5. Writes records directly to AWS DynamoDB:
 *    - FitResQCases (Item: caseRecord)
 *    - FitResQSLA (Item: slaRecord)
 *    - FitResQAudit (Item: auditRecord)
 * 6. Returns 200 with complete ticket details and SLA guarantees.
 * 7. Supports CORS preflight (OPTIONS) with standard FitResQ security headers.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { randomBytes } from 'crypto';

const REGION = process.env.AWS_REGION || 'ap-south-1';
const CASES_TABLE = process.env.CASES_TABLE || 'FitResQCases';
const SLA_TABLE = process.env.SLA_TABLE || 'FitResQSLA';
const AUDIT_TABLE = process.env.AUDIT_TABLE || 'FitResQAudit';
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'FitResQOrders';

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Generate unique 8-character uppercase hex identifier
 */
function generateId(prefix = 'FR-') {
  return `${prefix}${randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Parses JSON body from API Gateway event (handles string, base64, or pre-parsed object)
 */
export function parseRequestBody(event) {
  if (!event || !event.body) return {};
  if (typeof event.body === 'object') return event.body;

  let bodyString = event.body;
  if (event.isBase64Encoded) {
    try {
      bodyString = Buffer.from(bodyString, 'base64').toString('utf8');
    } catch (e) {
      console.warn('[parseRequestBody] Failed to decode base64 body:', e.message);
    }
  }

  try {
    return JSON.parse(bodyString);
  } catch (err) {
    console.warn('[parseRequestBody] Failed to parse JSON body:', err.message);
    return {};
  }
}

/**
 * Validates order existence in FitResQOrders and extracts customer/user ID
 */
export async function validateAndResolveOrder(orderId, client) {
  const ddb = (client && typeof client.send === 'function') ? client : docClient;
  if (!orderId) {
    return { valid: false, error: 'Order ID is required (e.g. ORD-10021).', statusCode: 400 };
  }

  const cleanOrderId = orderId.trim().toUpperCase();

  try {
    const getCmd = new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId: cleanOrderId },
    });
    const res = await ddb.send(getCmd);
    if (res && res.Item) {
      return {
        valid: true,
        order: res.Item,
        userId: res.Item.userId || 'CUS-001',
      };
    }
    return {
      valid: false,
      error: `Order '${cleanOrderId}' does not exist in the FitResQ system. Please verify your order number.`,
      statusCode: 404,
    };
  } catch (err) {
    console.error(`[validateAndResolveOrder] Error querying ${ORDERS_TABLE}:`, err.message);
    return {
      valid: false,
      error: `Database error verifying order: ${err.message}`,
      statusCode: 500,
    };
  }
}

/**
 * Extracts customer/user ID from order or Cognito token claims (backwards compatibility)
 */
export async function resolveUserId(orderId, client) {
  const check = await validateAndResolveOrder(orderId, client);
  return check.valid ? check.userId : 'CUS-001';
}

/**
 * Priority classification heuristic
 */
export function determinePriority(reason = '', description = '') {
  const combined = `${reason} ${description}`.toLowerCase();
  const highUrgencyKeywords = [
    'damage', 'defect', 'broken', 'torn', 'wrong item', 'fake',
    'incorrect', 'urgent', 'immediately', 'legal', 'scam', 'fraud'
  ];
  const lowUrgencyKeywords = [
    'question', 'info', 'inquiry', 'size chart', 'exchange color',
    'sizing', 'fit', 'changed mind', 'minor'
  ];

  if (highUrgencyKeywords.some((w) => combined.includes(w))) {
    return 'HIGH';
  }
  if (lowUrgencyKeywords.some((w) => combined.includes(w))) {
    return 'LOW';
  }
  return 'MEDIUM';
}

/**
 * Lambda Handler for POST /refund-requests
 */
export const handler = async (event = {}, context = {}, client) => {
  // Use the real docClient whenever the optional injected client does not have a .send() function.
  // This completely prevents AWS Lambda's runtime callback argument from overriding docClient.
  const ddb = (client && typeof client.send === 'function') ? client : docClient;

  // 1. Handle CORS Preflight OPTIONS
  const method = event.requestContext?.http?.method || event.httpMethod;
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      isBase64Encoded: false,
      body: '',
    };
  }

  // 2. Parse and validate request payload
  const body = parseRequestBody(event);
  const orderId = (body.orderId || '').trim().toUpperCase();
  const reason = (body.reason || '').trim();
  const description = (body.description || '').trim();

  if (!orderId) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      isBase64Encoded: false,
      body: JSON.stringify({
        error: 'BadRequest',
        message: 'Order ID is required (e.g. ORD-10021).',
      }),
    };
  }

  if (!reason) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      isBase64Encoded: false,
      body: JSON.stringify({
        error: 'BadRequest',
        message: 'Refund reason is required.',
      }),
    };
  }

  // 3. Strict Data Integrity: Verify order exists in FitResQOrders before creating case/SLA/audit
  const orderCheck = await validateAndResolveOrder(orderId, ddb);
  if (!orderCheck.valid) {
    return {
      statusCode: orderCheck.statusCode || 404,
      headers: CORS_HEADERS,
      isBase64Encoded: false,
      body: JSON.stringify({
        error: orderCheck.statusCode === 500 ? 'InternalServerError' : 'NotFound',
        message: orderCheck.error,
      }),
    };
  }
  const userId = orderCheck.userId;

  // 4. Generate IDs and Timestamps
  const caseId = generateId('FR-');
  const auditId = generateId('AUD-');
  const now = new Date();
  const createdAtIso = now.toISOString();

  // SLA duration: 24 hours
  const slaHours = 24.0;
  const deadlineDate = new Date(now.getTime() + slaHours * 3600 * 1000);
  const slaDeadlineIso = deadlineDate.toISOString();

  const priority = determinePriority(reason, description);

  // 5. Construct Case, SLA, and Audit records
  const caseRecord = {
    caseId,
    userId,
    orderId,
    category: 'REFUND_REQUEST',
    reason,
    description,
    status: 'OPEN',
    priority,
    sentiment: 'NEUTRAL',
    escalationLevel: '0',
    slaDeadline: slaDeadlineIso,
    createdAt: createdAtIso,
    updatedAt: createdAtIso,
  };

  const slaRecord = {
    caseId,
    orderId,
    userId,
    deadline: slaDeadlineIso,
    createdAt: createdAtIso,
    durationHours: slaHours,
    status: 'ACTIVE',
    escalationLevel: '0',
    breached: false,
  };

  const auditRecord = {
    auditId,
    eventType: 'REFUND_REQUEST_CREATED',
    actorType: 'CUSTOMER',
    caseId,
    orderId,
    userId,
    timestamp: createdAtIso,
    details: {
      reason,
      description,
      slaDeadline: slaDeadlineIso,
      priority,
      durationHours: slaHours,
    },
  };

  // 6. Persist directly to AWS DynamoDB tables using resolved client
  try {
    // Write Case record
    await ddb.send(new PutCommand({
      TableName: CASES_TABLE,
      Item: caseRecord,
    }));
    console.log(`[CreateRefundRequest] Successfully saved case ${caseId} to ${CASES_TABLE}`);

    // Write SLA record
    await ddb.send(new PutCommand({
      TableName: SLA_TABLE,
      Item: slaRecord,
    }));
    console.log(`[CreateRefundRequest] Successfully saved SLA record for ${caseId} to ${SLA_TABLE}`);

    // Write Audit record (non-blocking if audit table differs)
    try {
      await ddb.send(new PutCommand({
        TableName: AUDIT_TABLE,
        Item: auditRecord,
      }));
    } catch (auditErr) {
      console.warn(`[CreateRefundRequest] Note writing to ${AUDIT_TABLE}: ${auditErr.message}`);
    }

    // 7. Return success response
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      isBase64Encoded: false,
      body: JSON.stringify({
        success: true,
        caseId,
        orderId,
        status: 'OPEN',
        priority,
        slaDeadline: slaDeadlineIso,
        durationHours: slaHours,
        createdAt: createdAtIso,
        message: 'Refund request submitted successfully. A support specialist will review your request within the SLA window.',
      }),
    };
  } catch (err) {
    console.error(`[CreateRefundRequest] DynamoDB error persisting case ${caseId}:`, err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      isBase64Encoded: false,
      body: JSON.stringify({
        error: 'InternalServerError',
        message: `Failed to record refund request in database: ${err.message}`,
      }),
    };
  }
};

export default handler;
