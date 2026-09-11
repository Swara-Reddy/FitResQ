/**
 * FitResQ Backend — GET /users/me Lambda Handler
 *
 * Identifies the currently authenticated customer from the Cognito JWT `sub`
 * passed by API Gateway's Cognito Authorizer (FitResQCognitoAuth).
 *
 * Flow:
 * 1. Reads authenticated Cognito JWT claims from request context.
 * 2. Extracts `sub` claim (UUID).
 * 3. Queries DynamoDB table `FitResQUsers` for `cognitoSub = JWT sub`.
 * 4. Returns matched customer profile: userId, name, email, phone, role, createdAt.
 * 5. Returns 404 if no profile is mapped to this sub.
 * 6. Returns 401 if unauthenticated / no valid claims found.
 *
 * Requirements:
 * - No hardcoded user IDs, emails, or subs.
 * - Non-destructive: leaves FitResQUsers data completely unchanged.
 * - Dual query support: uses GSI `cognitoSub-index` with safe fallback to Scan.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'ap-south-1';
const USERS_TABLE = process.env.USERS_TABLE || 'FitResQUsers';

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

/**
 * Decodes the payload of a JWT token string without verification.
 * Used as a fallback when API Gateway authorizer passes the token in headers.
 */
export function extractSubFromJwtString(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const claims = JSON.parse(payloadJson);
    return claims?.sub || null;
  } catch {
    return null;
  }
}

/**
 * Extracts the Cognito sub claim from various API Gateway payload formats:
 * 1. HTTP API payload v2.0 (event.requestContext.authorizer.jwt.claims.sub)
 * 2. REST API / HTTP API v1.0 (event.requestContext.authorizer.claims.sub)
 * 3. Direct flattened claims (event.requestContext.authorizer.sub)
 * 4. Fallback: decodes Authorization: Bearer <JWT> header
 */
export function extractCognitoSub(event) {
  if (!event) return null;

  // 1. Primary: API Gateway Authorizer context (HTTP API v2.0)
  const authorizer = event.requestContext?.authorizer;
  if (authorizer) {
    if (authorizer.jwt?.claims?.sub) {
      return authorizer.jwt.claims.sub;
    }
    // REST API / HTTP API v1.0
    if (authorizer.claims?.sub) {
      return authorizer.claims.sub;
    }
    // Flattened authorizer claims
    if (authorizer.sub) {
      return authorizer.sub;
    }
  }

  // 2. Fallback: Parse JWT payload from Authorization header
  const authHeader =
    event.headers?.authorization ||
    event.headers?.Authorization;
  if (authHeader && typeof authHeader === 'string') {
    const cleanHeader = authHeader.trim();
    if (cleanHeader.toLowerCase().startsWith('bearer ')) {
      const token = cleanHeader.slice(7).trim();
      const sub = extractSubFromJwtString(token);
      if (sub) return sub;
    }
  }

  return null;
}

/**
 * Queries DynamoDB for a customer record where cognitoSub matches
 * First tries GSI cognitoSub-index; falls back to FilterExpression Scan if index not present.
 */
export async function findUserByCognitoSub(cognitoSub, client = docClient) {
  if (!cognitoSub) return null;

  const targetSub = String(cognitoSub).trim();

  // 1. Try Query on GSI cognitoSub-index (if index exists and permissions allow)
  try {
    const queryCmd = new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'cognitoSub-index',
      KeyConditionExpression: '#sub = :sub',
      ExpressionAttributeNames: {
        '#sub': 'cognitoSub',
      },
      ExpressionAttributeValues: {
        ':sub': targetSub,
      },
      Limit: 1,
    });
    const result = await client.send(queryCmd);
    if (result.Items && result.Items.length > 0) {
      return result.Items[0];
    }
  } catch (err) {
    // If GSI does not exist, lacks permissions (e.g. Scan only), or index is pending, fall back to Scan
    console.info('[getUserMe] Query on cognitoSub-index unavailable or failed, falling back to Scan:', err.message);
  }

  // 2. Fallback Scan on cognitoSub attribute across the entire table (no premature Limit: 1)
  try {
    let lastEvaluatedKey = undefined;
    do {
      const scanCmd = new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: '#sub = :sub',
        ExpressionAttributeNames: {
          '#sub': 'cognitoSub',
        },
        ExpressionAttributeValues: {
          ':sub': targetSub,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const result = await client.send(scanCmd);
      if (result.Items && result.Items.length > 0) {
        return result.Items[0];
      }
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);
  } catch (scanErr) {
    console.error('[getUserMe] Scan fallback error:', scanErr.message);
    throw scanErr;
  }

  return null;
}

/**
 * Lambda Handler for GET /users/me
 */
export const handler = async (event = {}, context = {}, client = docClient) => {
  // 1. Handle CORS preflight OPTIONS
  const method = event.requestContext?.http?.method || event.httpMethod;
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      isBase64Encoded: false,
      body: '',
    };
  }

  // 2. Extract authenticated Cognito sub
  const cognitoSub = extractCognitoSub(event);

  if (!cognitoSub) {
    console.warn('[getUserMe] Unauthenticated request: missing Cognito claims');
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      isBase64Encoded: false,
      body: JSON.stringify({
        error: 'Unauthorized',
        message: 'Authentication required. No valid Cognito sub found in request context.',
      }),
    };
  }

  console.log(`[getUserMe] Looking up customer profile for cognitoSub: ${cognitoSub}`);

  // 3. Query DynamoDB FitResQUsers
  try {
    const userItem = await findUserByCognitoSub(cognitoSub, client);

    if (!userItem) {
      console.log(`[getUserMe] No customer profile found for sub: ${cognitoSub}`);
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        isBase64Encoded: false,
        body: JSON.stringify({
          error: 'NotFound',
          message: 'Customer profile not found for the authenticated Cognito identity',
          cognitoSub: cognitoSub,
        }),
      };
    }

    // 4. Return matched customer profile
    const profile = {
      userId: userItem.userId,
      name: userItem.name,
      email: userItem.email,
      phone: userItem.phone,
      role: userItem.role || 'CUSTOMER',
      createdAt: userItem.createdAt,
    };

    console.log(`[getUserMe] Successfully matched sub ${cognitoSub} to customer ${profile.userId}`);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      isBase64Encoded: false,
      body: JSON.stringify(profile),
    };
  } catch (err) {
    console.error('[getUserMe] DynamoDB error querying user:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      isBase64Encoded: false,
      body: JSON.stringify({
        error: 'InternalServerError',
        message: 'Failed to retrieve customer profile from database',
      }),
    };
  }
};

export default handler;
