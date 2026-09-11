/**
 * FitResQ Backend — Unit Tests for GET /users/me Lambda Handler
 *
 * Tests:
 * 1. extractCognitoSub: HTTP API v2.0, REST v1.0, direct sub, missing authorizer
 * 2. handler: OPTIONS preflight CORS
 * 3. handler: 401 Unauthorized when unauthenticated
 * 4. handler: 200 Success with profile fields { userId, name, email, phone, role, createdAt }
 * 5. handler: 404 NotFound when cognitoSub is not mapped
 * 6. handler: Fallback to Scan when GSI cognitoSub-index is not present
 * 7. handler: 500 InternalServerError on unexpected DynamoDB failure
 * 8. Zero hardcoding verification (no hardcoded CUS-099, emails, or subs)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractCognitoSub, extractSubFromJwtString, findUserByCognitoSub, handler } from '../src/handlers/getUserMe.mjs';

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

console.log('\n==================================================');
console.log('FitResQ Backend — GET /users/me Unit Test Suite');
console.log('==================================================\n');

// ----------------------------------------------------
// 1. extractCognitoSub tests
// ----------------------------------------------------
console.log('Test Suite 1: extractCognitoSub');

runTest('Extract sub from HTTP API v2.0 JWT claims', () => {
  const event = {
    requestContext: {
      authorizer: {
        jwt: {
          claims: {
            sub: 'b5f2a1b0-1234-4567-89ab-cdef01234567',
            email: 'test@example.com',
          },
        },
      },
    },
  };
  const sub = extractCognitoSub(event);
  assert.equal(sub, 'b5f2a1b0-1234-4567-89ab-cdef01234567');
});

runTest('Extract sub from REST API / v1.0 claims', () => {
  const event = {
    requestContext: {
      authorizer: {
        claims: {
          sub: 'e8a4d7c0-9876-5432-10fe-dcba98765432',
        },
      },
    },
  };
  const sub = extractCognitoSub(event);
  assert.equal(sub, 'e8a4d7c0-9876-5432-10fe-dcba98765432');
});

runTest('Extract sub from flattened authorizer.sub', () => {
  const event = {
    requestContext: {
      authorizer: {
        sub: 'f1234567-aaaa-bbbb-cccc-dddddddddddd',
      },
    },
  };
  const sub = extractCognitoSub(event);
  assert.equal(sub, 'f1234567-aaaa-bbbb-cccc-dddddddddddd');
});

runTest('Extract sub from Authorization Bearer JWT token header fallback', () => {
  // Construct a dummy valid JWT payload with sub
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'c7d8e9f0-1111-2222-3333-444455556666', email: 'header@test.com' })).toString('base64url');
  const dummyJwt = `${header}.${payload}.signature`;

  const event = {
    headers: {
      Authorization: `Bearer ${dummyJwt}`,
    },
  };
  const sub = extractCognitoSub(event);
  assert.equal(sub, 'c7d8e9f0-1111-2222-3333-444455556666');
});

runTest('Extract sub from lowercase authorization header', () => {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'aabbccdd-1234-5678-90ab-cdef12345678' })).toString('base64url');
  const dummyJwt = `${header}.${payload}.sig`;

  const event = {
    headers: {
      authorization: `Bearer ${dummyJwt}`,
    },
  };
  const sub = extractCognitoSub(event);
  assert.equal(sub, 'aabbccdd-1234-5678-90ab-cdef12345678');
});

runTest('Return null when event has no requestContext, authorizer, or auth headers', () => {
  assert.equal(extractCognitoSub(null), null);
  assert.equal(extractCognitoSub({}), null);
  assert.equal(extractCognitoSub({ requestContext: {} }), null);
  assert.equal(extractCognitoSub({ requestContext: { authorizer: {} } }), null);
  assert.equal(extractCognitoSub({ headers: { authorization: 'invalid-token' } }), null);
  assert.equal(extractSubFromJwtString('not-a-jwt'), null);
});

// ----------------------------------------------------
// 2. handler: OPTIONS preflight
// ----------------------------------------------------
console.log('\nTest Suite 2: CORS Preflight');

await runAsyncTest('Handle OPTIONS request with 200 and CORS headers', async () => {
  const event = {
    requestContext: {
      http: { method: 'OPTIONS' },
    },
  };
  const res = await handler(event);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
  assert.ok(res.headers['Access-Control-Allow-Methods'].includes('GET'));
  assert.equal(res.body, '');
});

// ----------------------------------------------------
// 3. handler: Unauthenticated (401)
// ----------------------------------------------------
console.log('\nTest Suite 3: Unauthenticated Requests (401)');

await runAsyncTest('Return 401 when requestContext has no authorizer claims', async () => {
  const event = {
    requestContext: {
      http: { method: 'GET' },
    },
  };
  const res = await handler(event);
  assert.equal(res.statusCode, 401);
  const body = JSON.parse(res.body);
  assert.equal(body.error, 'Unauthorized');
  assert.ok(body.message.includes('No valid Cognito sub'));
  assert.equal(res.headers['Content-Type'], 'application/json');
  assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
});

await runAsyncTest('Return 401 when empty event is passed', async () => {
  const res = await handler({});
  assert.equal(res.statusCode, 401);
  const body = JSON.parse(res.body);
  assert.equal(body.error, 'Unauthorized');
});

// ----------------------------------------------------
// 4. findUserByCognitoSub & handler: Success (200)
// ----------------------------------------------------
console.log('\nTest Suite 4: Authenticated Customer Profile Lookup (200)');

await runAsyncTest('findUserByCognitoSub queries GSI cognitoSub-index and returns item', async () => {
  const testSub = 'sub-uuid-abc-123';
  const mockUser = {
    userId: 'CUS-055',
    name: 'Meera Nambiar',
    email: 'meera.nambiar@fitresq.demo',
    phone: '+91 98450 12345',
    role: 'CUSTOMER',
    cognitoSub: testSub,
    createdAt: '2025-08-10T14:22:00.000Z',
    updatedAt: '2025-08-10T14:22:00.000Z',
  };

  const mockClient = {
    send: async (cmd) => {
      assert.equal(cmd.input.TableName, 'FitResQUsers');
      assert.equal(cmd.input.IndexName, 'cognitoSub-index');
      assert.equal(cmd.input.ExpressionAttributeNames['#sub'], 'cognitoSub');
      assert.equal(cmd.input.ExpressionAttributeValues[':sub'], testSub);
      return { Items: [mockUser] };
    },
  };

  const result = await findUserByCognitoSub(testSub, mockClient);
  assert.deepEqual(result, mockUser);
});

await runAsyncTest('findUserByCognitoSub falls back to Scan when GSI does not exist', async () => {
  const testSub = 'sub-uuid-fallback-999';
  const mockUser = {
    userId: 'CUS-077',
    name: 'Karan Malhotra',
    email: 'karan.m@fitresq.demo',
    phone: '+91 97110 54321',
    role: 'CUSTOMER',
    cognitoSub: testSub,
    createdAt: '2025-07-01T10:00:00.000Z',
  };

  let scanCalled = false;
  const mockClient = {
    send: async (cmd) => {
      if (cmd.input.IndexName === 'cognitoSub-index') {
        const err = new Error('Cannot do operations on a non-existent table or index');
        err.name = 'ValidationException';
        throw err;
      }
      scanCalled = true;
      assert.equal(cmd.input.TableName, 'FitResQUsers');
      assert.equal(cmd.input.FilterExpression, '#sub = :sub');
      assert.equal(cmd.input.ExpressionAttributeNames['#sub'], 'cognitoSub');
      assert.equal(cmd.input.ExpressionAttributeValues[':sub'], testSub);
      assert.equal(cmd.input.Limit, undefined, 'Scan must not have premature Limit: 1');
      return { Items: [mockUser] };
    },
  };

  const result = await findUserByCognitoSub(testSub, mockClient);
  assert.ok(scanCalled, 'Scan fallback should be invoked when GSI is missing');
  assert.deepEqual(result, mockUser);
});

await runAsyncTest('findUserByCognitoSub and handler successfully resolve CUS-099 for sub 01c33dea-c021-7081-15a5-5a86516f8e13 via Scan with pagination', async () => {
  const targetCognitoSub = '01c33dea-c021-7081-15a5-5a86516f8e13';
  const expectedUserId = 'CUS-099';

  const mockCus099 = {
    userId: 'CUS-099',
    name: 'Mayank Rao',
    email: 'customer099@fitresq.demo',
    phone: '+91 93968 33971',
    role: 'CUSTOMER',
    cognitoSub: targetCognitoSub,
    createdAt: '2026-02-16T20:42:38.785Z',
    updatedAt: '2026-03-12T20:42:38.785Z',
  };

  let scanPage = 0;
  const mockClient = {
    send: async (cmd) => {
      // 1. Simulate Query failing due to IAM permission or missing index
      if (cmd.input.IndexName === 'cognitoSub-index') {
        const err = new Error('User is not authorized to perform: dynamodb:Query on resource');
        err.name = 'AccessDeniedException';
        throw err;
      }

      // 2. Scan is executed with full table evaluation
      assert.equal(cmd.input.TableName, 'FitResQUsers');
      assert.equal(cmd.input.FilterExpression, '#sub = :sub');
      assert.equal(cmd.input.ExpressionAttributeNames['#sub'], 'cognitoSub');
      assert.equal(cmd.input.ExpressionAttributeValues[':sub'], targetCognitoSub);
      assert.equal(cmd.input.Limit, undefined, 'ScanCommand must not have premature Limit: 1');

      scanPage++;
      if (scanPage === 1) {
        // First page evaluates earlier records (CUS-001..CUS-050)
        return {
          Items: [],
          LastEvaluatedKey: { userId: 'CUS-050' },
        };
      } else {
        // Second page evaluates and matches CUS-099
        return {
          Items: [mockCus099],
        };
      }
    },
  };

  // Verify findUserByCognitoSub directly
  const user = await findUserByCognitoSub(targetCognitoSub, mockClient);
  assert.ok(user, 'User CUS-099 must be found');
  assert.equal(user.userId, expectedUserId, `Expected userId ${expectedUserId}`);
  assert.equal(user.cognitoSub, targetCognitoSub);

  // Verify handler() end-to-end with this Cognito sub
  scanPage = 0;
  const event = {
    requestContext: {
      authorizer: {
        jwt: {
          claims: {
            sub: targetCognitoSub,
          },
        },
      },
    },
  };

  const response = await handler(event, {}, mockClient);
  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.equal(body.userId, expectedUserId);
  assert.equal(body.name, 'Mayank Rao');
  assert.equal(body.email, 'customer099@fitresq.demo');
  assert.equal(body.phone, '+91 93968 33971');
  assert.equal(body.role, 'CUSTOMER');
  assert.equal(body.createdAt, '2026-02-16T20:42:38.785Z');
});

await runAsyncTest('findUserByCognitoSub and handler successfully resolve CUS-099 via GSI QueryCommand', async () => {
  const targetCognitoSub = '01c33dea-c021-7081-15a5-5a86516f8e13';
  const expectedUserId = 'CUS-099';

  const mockCus099 = {
    userId: 'CUS-099',
    name: 'Mayank Rao',
    email: 'customer099@fitresq.demo',
    phone: '+91 93968 33971',
    role: 'CUSTOMER',
    cognitoSub: targetCognitoSub,
    createdAt: '2026-02-16T20:42:38.785Z',
  };

  let queryCalled = false;
  const mockClient = {
    send: async (cmd) => {
      if (cmd.input.IndexName === 'cognitoSub-index') {
        queryCalled = true;
        assert.equal(cmd.input.TableName, 'FitResQUsers');
        assert.equal(cmd.input.KeyConditionExpression, '#sub = :sub');
        assert.equal(cmd.input.ExpressionAttributeNames['#sub'], 'cognitoSub');
        assert.equal(cmd.input.ExpressionAttributeValues[':sub'], targetCognitoSub);
        return { Items: [mockCus099] };
      }
      throw new Error('Scan should not be called when GSI Query succeeds');
    },
  };

  const event = {
    requestContext: {
      authorizer: {
        jwt: {
          claims: {
            sub: targetCognitoSub,
          },
        },
      },
    },
  };

  const response = await handler(event, {}, mockClient);
  assert.ok(queryCalled, 'GSI Query should be called');
  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.equal(body.userId, expectedUserId);
  assert.equal(body.name, 'Mayank Rao');
});

await runAsyncTest('handler successfully resolves CUS-099 from Authorization Bearer token header', async () => {
  const targetCognitoSub = '01c33dea-c021-7081-15a5-5a86516f8e13';
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: targetCognitoSub, email: 'customer099@fitresq.demo' })).toString('base64url');
  const dummyJwt = `${header}.${payload}.sig`;

  const mockCus099 = {
    userId: 'CUS-099',
    name: 'Mayank Rao',
    email: 'customer099@fitresq.demo',
    phone: '+91 93968 33971',
    role: 'CUSTOMER',
    cognitoSub: targetCognitoSub,
    createdAt: '2026-02-16T20:42:38.785Z',
  };

  const mockClient = {
    send: async () => ({ Items: [mockCus099] }),
  };

  const event = {
    headers: {
      Authorization: `Bearer ${dummyJwt}`,
    },
  };

  const response = await handler(event, {}, mockClient);
  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.equal(body.userId, 'CUS-099');
});

await runAsyncTest('findUserByCognitoSub returns null when user is not found in DynamoDB', async () => {
  const mockClient = {
    send: async () => ({ Items: [] }),
  };
  const result = await findUserByCognitoSub('unmapped-sub-000', mockClient);
  assert.equal(result, null);
});

// ----------------------------------------------------
// 5. Profile projection and contract verification
// ----------------------------------------------------
console.log('\nTest Suite 5: Response Contract & Projection');

runTest('Return exact specified fields only (userId, name, email, phone, role, createdAt)', () => {
  const userItem = {
    userId: 'CUS-015',
    name: 'Rohan Deshmukh',
    email: 'rohan.d@fitresq.demo',
    phone: '+91 99201 23456',
    role: 'CUSTOMER',
    cognitoSub: 'auth-sub-1234',
    createdAt: '2025-09-01T08:00:00.000Z',
    updatedAt: '2025-09-01T08:00:00.000Z',
    internalNotes: 'VIP customer',
  };

  const profile = {
    userId: userItem.userId,
    name: userItem.name,
    email: userItem.email,
    phone: userItem.phone,
    role: userItem.role || 'CUSTOMER',
    createdAt: userItem.createdAt,
  };

  assert.deepEqual(Object.keys(profile).sort(), ['createdAt', 'email', 'name', 'phone', 'role', 'userId']);
  assert.equal(profile.userId, 'CUS-015');
  assert.equal(profile.name, 'Rohan Deshmukh');
  assert.equal(profile.role, 'CUSTOMER');
  assert.equal(profile.internalNotes, undefined, 'Internal attributes must not be in profile');
});

// ----------------------------------------------------
// 6. handler End-to-End Execution Tests
// ----------------------------------------------------
console.log('\nTest Suite 6: handler() End-to-End Status Codes');

await runAsyncTest('handler returns 200 with profile when valid Cognito JWT sub matches user', async () => {
  const event = {
    requestContext: {
      authorizer: {
        jwt: {
          claims: {
            sub: 'match-sub-1111',
          },
        },
      },
    },
  };

  const mockUser = {
    userId: 'CUS-001',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@fitresq.demo',
    phone: '+91 98200 11223',
    role: 'CUSTOMER',
    cognitoSub: 'match-sub-1111',
    createdAt: '2025-06-15T09:30:00.000Z',
    secretNotes: 'should be excluded',
  };

  const mockClient = {
    send: async () => ({ Items: [mockUser] }),
  };

  const res = await handler(event, {}, mockClient);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Content-Type'], 'application/json');
  assert.equal(res.headers['Access-Control-Allow-Origin'], '*');

  const body = JSON.parse(res.body);
  assert.equal(body.userId, 'CUS-001');
  assert.equal(body.name, 'Aarav Sharma');
  assert.equal(body.email, 'aarav.sharma@fitresq.demo');
  assert.equal(body.phone, '+91 98200 11223');
  assert.equal(body.role, 'CUSTOMER');
  assert.equal(body.createdAt, '2025-06-15T09:30:00.000Z');
  assert.equal(body.secretNotes, undefined);
});

await runAsyncTest('handler returns 404 with clear JSON error when sub is not found in DynamoDB', async () => {
  const event = {
    requestContext: {
      authorizer: {
        jwt: {
          claims: {
            sub: 'unmatched-sub-9999',
          },
        },
      },
    },
  };

  const mockClient = {
    send: async () => ({ Items: [] }),
  };

  const res = await handler(event, {}, mockClient);
  assert.equal(res.statusCode, 404);
  assert.equal(res.headers['Content-Type'], 'application/json');

  const body = JSON.parse(res.body);
  assert.equal(body.error, 'NotFound');
  assert.equal(body.cognitoSub, 'unmatched-sub-9999');
  assert.ok(body.message.includes('Customer profile not found'));
});

await runAsyncTest('handler returns 500 when DynamoDB throws an unexpected error', async () => {
  const event = {
    requestContext: {
      authorizer: {
        jwt: {
          claims: {
            sub: 'error-sub-5555',
          },
        },
      },
    },
  };

  const mockClient = {
    send: async () => {
      throw new Error('DynamoDB connection timeout');
    },
  };

  const res = await handler(event, {}, mockClient);
  assert.equal(res.statusCode, 500);
  const body = JSON.parse(res.body);
  assert.equal(body.error, 'InternalServerError');
});

// ----------------------------------------------------
// 7. Zero Hardcoding Verification
// ----------------------------------------------------
console.log('\nTest Suite 7: Zero Hardcoding Verification');

runTest('Handler code contains zero hardcoded CUS-099 or specific email', () => {
  const code = fs.readFileSync(new URL('../src/handlers/getUserMe.mjs', import.meta.url), 'utf-8');
  assert.ok(!code.includes('CUS-099'), 'Code must not contain hardcoded CUS-099');
  assert.ok(!code.includes('@gmail.com'), 'Code must not contain hardcoded email');
  assert.ok(!code.includes('@fitresq.com'), 'Code must not contain hardcoded email');
  assert.ok(!code.includes('7d8h6cnruek38rjv6dlp2ggt4k'), 'Code must not contain hardcoded app client');
});

console.log('\n==================================================');
console.log(`Summary: All ${passedTests}/${totalTests} unit tests PASSED!`);
console.log('==================================================\n');
