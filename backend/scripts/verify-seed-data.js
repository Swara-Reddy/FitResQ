/**
 * FitResQ Synthetic Dataset Verification Script
 * Validates all schema requirements, distribution constraints,
 * referential integrity, and safe privacy rules.
 */

import assert from 'assert';
import { generateFitResQDataset } from './generate-dataset.js';

function runVerification() {
  console.log('====================================================');
  console.log('       FitResQ Dataset Verification Suite');
  console.log('====================================================\n');

  const dataset = generateFitResQDataset(42);
  const { customers, orders, refunds, cases, messages, summary } = dataset;

  let checksPassed = 0;

  // 1. Customer Count Check
  console.log('Check 1: Verifying customer count...');
  assert.strictEqual(customers.length, 100, `Expected exactly 100 customers, got ${customers.length}`);
  for (let i = 1; i <= 100; i++) {
    const expectedId = `CUS-${String(i).padStart(3, '0')}`;
    assert.strictEqual(customers[i - 1].userId, expectedId, `Expected ${expectedId} at index ${i - 1}`);
  }
  console.log(`✔ Exactly 100 customers generated (CUS-001 to CUS-100).`);
  checksPassed++;

  // 2. Order Count Check
  console.log('\nCheck 2: Verifying order count (target: 250–400)...');
  assert.ok(
    orders.length >= 250 && orders.length <= 400,
    `Order count ${orders.length} out of range [250, 400]`
  );
  console.log(`✔ Order count is ${orders.length} (within target range [250, 400]).`);
  checksPassed++;

  // 3. Refund Count Check
  console.log('\nCheck 3: Verifying refund count (target: 80–150)...');
  assert.ok(
    refunds.length >= 80 && refunds.length <= 150,
    `Refund count ${refunds.length} out of range [80, 150]`
  );
  console.log(`✔ Refund count is ${refunds.length} (within target range [80, 150]).`);
  checksPassed++;

  // 4. Case Count Check
  console.log('\nCheck 4: Verifying case count (target: 100–200)...');
  assert.ok(
    cases.length >= 100 && cases.length <= 200,
    `Case count ${cases.length} out of range [100, 200]`
  );
  console.log(`✔ Case count is ${cases.length} (within target range [100, 200]).`);
  checksPassed++;

  // 5. Message Count Check
  console.log('\nCheck 5: Verifying message count (target: 300–600)...');
  assert.ok(
    messages.length >= 300 && messages.length <= 600,
    `Message count ${messages.length} out of range [300, 600]`
  );
  console.log(`✔ Message count is ${messages.length} (within target range [300, 600]).`);
  checksPassed++;

  // 6. Referential Integrity: Orders -> Customers
  console.log('\nCheck 6: Verifying every order belongs to a valid customer...');
  const customerIdSet = new Set(customers.map((c) => c.userId));
  orders.forEach((ord) => {
    assert.ok(customerIdSet.has(ord.userId), `Order ${ord.orderId} references invalid userId ${ord.userId}`);
    assert.ok(ord.items && ord.items.length > 0, `Order ${ord.orderId} must have items`);
    assert.ok(ord.totalAmount > 0, `Order ${ord.totalAmount} must have positive totalAmount`);
  });
  console.log(`✔ All ${orders.length} orders mapped to valid customers.`);
  checksPassed++;

  // 7. Referential Integrity: Refunds -> Orders & Customers
  console.log('\nCheck 7: Verifying every refund belongs to a valid order and customer...');
  const orderIdMap = new Map(orders.map((o) => [o.orderId, o]));
  refunds.forEach((ref) => {
    assert.ok(orderIdMap.has(ref.orderId), `Refund ${ref.refundId} references non-existent order ${ref.orderId}`);
    assert.ok(customerIdSet.has(ref.userId), `Refund ${ref.refundId} references invalid userId ${ref.userId}`);
    const parentOrder = orderIdMap.get(ref.orderId);
    assert.strictEqual(parentOrder.userId, ref.userId, `Refund customer mismatch on order ${ref.orderId}`);
  });
  console.log(`✔ All ${refunds.length} refunds belong to corresponding valid orders and customers.`);
  checksPassed++;

  // 8. Referential Integrity: Cases -> Customers & Orders
  console.log('\nCheck 8: Verifying every case belongs to a valid customer...');
  cases.forEach((kase) => {
    assert.ok(customerIdSet.has(kase.userId), `Case ${kase.caseId} references invalid userId ${kase.userId}`);
    if (kase.orderId) {
      assert.ok(orderIdMap.has(kase.orderId), `Case ${kase.caseId} references non-existent order ${kase.orderId}`);
    }
  });
  console.log(`✔ All ${cases.length} cases belong to valid customers.`);
  checksPassed++;

  // 9. Referential Integrity: Messages -> Cases
  console.log('\nCheck 9: Verifying every message belongs to an existing case...');
  const caseIdSet = new Set(cases.map((c) => c.caseId));
  messages.forEach((msg) => {
    assert.ok(caseIdSet.has(msg.caseId), `Message references non-existent caseId ${msg.caseId}`);
    assert.ok(msg.messageKey && msg.messageKey.includes('#MSG-'), `Message key format invalid: ${msg.messageKey}`);
    assert.ok(msg.message && msg.message.length > 0, `Message content cannot be empty`);
  });
  console.log(`✔ All ${messages.length} messages belong to valid support cases.`);
  checksPassed++;

  // 10. Privacy & Fictional Data Verification
  console.log('\nCheck 10: Verifying safe fictional email domains and customer privacy...');
  customers.forEach((cust) => {
    assert.ok(
      cust.email.endsWith('@fitresq.demo'),
      `Customer ${cust.userId} has non-fictional email domain: ${cust.email}`
    );
    assert.strictEqual(cust.cognitoSub, null, `Customer ${cust.userId} cognitoSub should be null initially`);
  });
  console.log(`✔ All customer emails use safe @fitresq.demo domain.`);
  checksPassed++;

  // 11. Primary Key Uniqueness
  console.log('\nCheck 11: Verifying primary key uniqueness across all entities...');
  const checkUnique = (items, keyFn, name) => {
    const seen = new Set();
    items.forEach((item) => {
      const k = keyFn(item);
      assert.ok(!seen.has(k), `Duplicate primary key found in ${name}: ${k}`);
      seen.add(k);
    });
  };

  checkUnique(customers, (c) => c.userId, 'customers');
  checkUnique(orders, (o) => o.orderId, 'orders');
  checkUnique(refunds, (r) => r.orderId, 'refunds');
  checkUnique(cases, (c) => c.caseId, 'cases');
  checkUnique(messages, (m) => `${m.caseId}#${m.messageKey}`, 'messages');
  console.log(`✔ Zero duplicate keys across all 5 tables.`);
  checksPassed++;

  // 12. Preservation of Existing CUS-001 Live Records
  console.log('\nCheck 12: Verifying preservation of existing CUS-001 live records...');
  assert.ok(orderIdMap.has('ORD-10021'), 'Existing order ORD-10021 must be preserved');
  assert.ok(orderIdMap.has('ORD-10055'), 'Existing order ORD-10055 must be preserved');
  assert.ok(orderIdMap.has('ORD-10101'), 'Existing order ORD-10101 must be preserved');
  assert.ok(orderIdMap.has('ORD-10102'), 'Existing order ORD-10102 must be preserved');

  const ref10021 = refunds.find((r) => r.orderId === 'ORD-10021');
  assert.ok(ref10021 && ref10021.refundId === 'RF-90001', 'Existing refund RF-90001 must be preserved');

  assert.ok(caseIdSet.has('FR-1F40B7F5'), 'Existing case FR-1F40B7F5 must be preserved');
  assert.ok(caseIdSet.has('FR-7D002B18'), 'Existing case FR-7D002B18 must be preserved');
  assert.ok(caseIdSet.has('FR-32534B62'), 'Existing case FR-32534B62 must be preserved');
  assert.ok(caseIdSet.has('FR-648D23C3'), 'Existing case FR-648D23C3 must be preserved');
  assert.ok(caseIdSet.has('FR-10001'), 'Existing case FR-10001 must be preserved');
  assert.ok(caseIdSet.has('FR-EDF067FF'), 'Existing case FR-EDF067FF must be preserved');
  assert.ok(caseIdSet.has('FR-10D468D0'), 'Existing case FR-10D468D0 must be preserved');

  const frMessages = messages.filter((m) => m.caseId === 'FR-1F40B7F5');
  assert.ok(frMessages.length >= 6, `Existing messages for FR-1F40B7F5 must be preserved (got ${frMessages.length})`);
  console.log(`✔ All existing production/test records for CUS-001 are strictly preserved.`);
  checksPassed++;

  console.log('\n====================================================');
  console.log(`🎉 ALL ${checksPassed}/12 VERIFICATION CHECKS PASSED PERFECTLY! 🎉`);
  console.log('====================================================');
}

runVerification();
