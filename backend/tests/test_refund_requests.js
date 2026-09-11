/**
 * Automated Verification Test for POST /refund-requests (ES Module)
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://127.0.0.1:8000';
const DATA_DIR = path.resolve(__dirname, '..', 'data');

async function testSuite() {
  console.log('====================================================');
  console.log('    FitResQ POST /refund-requests Verification');
  console.log('====================================================\n');

  // Test 1: Reject missing orderId
  console.log('Test 1: Rejecting missing orderId...');
  const res1 = await fetch(`${BASE_URL}/refund-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Damaged item' }),
  });
  assert.strictEqual(res1.status, 400, `Expected 400 for missing orderId, got ${res1.status}`);
  const data1 = await res1.json();
  console.log(`✔ Correctly rejected with HTTP 400: ${data1.detail}`);

  // Test 2: Reject missing reason
  console.log('\nTest 2: Rejecting missing reason...');
  const res2 = await fetch(`${BASE_URL}/refund-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: 'ORD-10021', reason: '   ' }),
  });
  assert.strictEqual(res2.status, 400, `Expected 400 for empty reason, got ${res2.status}`);
  const data2 = await res2.json();
  console.log(`✔ Correctly rejected with HTTP 400: ${data2.detail}`);

  // Test 3: Reject non-existent order
  console.log('\nTest 3: Rejecting non-existent order...');
  const res3 = await fetch(`${BASE_URL}/refund-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: 'ORD-99999', reason: 'Damaged item' }),
  });
  assert.strictEqual(res3.status, 404, `Expected 404 for invalid order, got ${res3.status}`);
  const data3 = await res3.json();
  console.log(`✔ Correctly rejected with HTTP 404: ${data3.detail}`);

  // Test 4: Valid refund request submission
  console.log('\nTest 4: Submitting valid refund request for ORD-10021...');
  const testPayload = {
    orderId: 'ORD-10021',
    reason: 'Damaged item',
    description: 'The package arrived torn and the shoes inside were scuffed.',
  };
  const res4 = await fetch(`${BASE_URL}/refund-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload),
  });
  assert.strictEqual(res4.status, 200, `Expected 200, got ${res4.status}`);
  const data4 = await res4.json();
  console.log('API Response:', JSON.stringify(data4, null, 2));

  assert.strictEqual(data4.success, true, 'Expected success: true');
  assert.ok(data4.caseId && data4.caseId.startsWith('FR-'), `Expected caseId starting with FR-, got ${data4.caseId}`);
  assert.strictEqual(data4.orderId, 'ORD-10021');
  assert.strictEqual(data4.status, 'OPEN');
  assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(data4.priority), `Expected valid priority, got ${data4.priority}`);
  assert.strictEqual(data4.durationHours, 24.0, 'Expected default 24h duration');
  
  // Verify SLA deadline calculation
  const createdDate = new Date(data4.createdAt);
  const deadlineDate = new Date(data4.slaDeadline);
  const diffHours = (deadlineDate - createdDate) / (1000 * 60 * 60);
  assert.ok(Math.abs(diffHours - 24) < 0.01, `Expected 24h SLA deadline diff, got ${diffHours}`);
  console.log(`✔ SLA deadline correctly computed at +24h: ${data4.slaDeadline}`);

  // Test 5: Verify records in data store
  console.log('\nTest 5: Verifying data store persistence (cases.json, sla.json, audit.json)...');
  
  const cases = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cases.json'), 'utf-8'));
  const foundCase = cases.find((c) => c.caseId === data4.caseId);
  assert.ok(foundCase, `Case ${data4.caseId} not found in cases.json`);
  assert.strictEqual(foundCase.orderId, 'ORD-10021');
  assert.strictEqual(foundCase.status, 'OPEN');
  console.log(`✔ Case record verified in cases.json: ${foundCase.caseId} (${foundCase.status})`);

  const slaRecords = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'sla.json'), 'utf-8'));
  const foundSla = slaRecords.find((s) => s.caseId === data4.caseId);
  assert.ok(foundSla, `SLA record for ${data4.caseId} not found in sla.json`);
  assert.strictEqual(foundSla.status, 'ACTIVE');
  assert.strictEqual(foundSla.durationHours, 24.0);
  console.log(`✔ SLA record verified in sla.json: deadline=${foundSla.deadline}, status=${foundSla.status}`);

  const auditRecords = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'audit.json'), 'utf-8'));
  const foundAudit = auditRecords.find((a) => a.caseId === data4.caseId);
  assert.ok(foundAudit, `Audit record for ${data4.caseId} not found in audit.json`);
  assert.strictEqual(foundAudit.eventType, 'REFUND_REQUEST_CREATED');
  assert.strictEqual(foundAudit.actorType, 'CUSTOMER');
  console.log(`✔ Audit record verified in audit.json: eventType=${foundAudit.eventType}, actorType=${foundAudit.actorType}`);

  console.log('\n🎉 ALL 5 BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

testSuite().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
