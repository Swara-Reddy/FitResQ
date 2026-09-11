/**
 * FitResQ AWS Lambda DynamoDB Seeder Handler
 *
 * Handler: index.handler
 * Runtime: Node.js 20.x or Node.js 18.x
 * Region:  ap-south-1
 *
 * This function is self-contained. It reads the bundled JSON files in ./data/
 * and inserts them safely into the target AWS DynamoDB tables using the Lambda's IAM execution role.
 *
 * Safety:
 * - Checks existing primary keys before insertion to prevent overwriting.
 * - Never deletes any records.
 * - Respects DynamoDB batch limits (25 items per BatchWriteItem, 100 items per BatchGetItem).
 * - Reports exact metrics: total, inserted, skipped, failed.
 */

import fs from 'fs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'ap-south-1';

const TABLE_NAMES = {
  USERS: process.env.USERS_TABLE || 'FitResQUsers',
  ORDERS: process.env.ORDERS_TABLE || 'FitResQOrders',
  REFUNDS: process.env.REFUNDS_TABLE || 'FitResQRefunds',
  CASES: process.env.CASES_TABLE || 'FitResQCases',
  MESSAGES: process.env.MESSAGES_TABLE || 'FitResQMessages',
};

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

function loadBundledData(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  return JSON.parse(fs.readFileSync(url, 'utf-8'));
}

async function filterExistingKeys(tableName, items, keyFn) {
  const existingKeySet = new Set();
  const BATCH_GET_LIMIT = 100;

  for (let i = 0; i < items.length; i += BATCH_GET_LIMIT) {
    const chunk = items.slice(i, i + BATCH_GET_LIMIT);
    const keys = chunk.map(keyFn);

    try {
      const command = new BatchGetCommand({
        RequestItems: {
          [tableName]: {
            Keys: keys,
            ProjectionExpression: Object.keys(keys[0]).join(', '),
          },
        },
      });

      const response = await docClient.send(command);
      const responses = response.Responses?.[tableName] || [];
      responses.forEach((foundItem) => {
        const idStr = Object.keys(keys[0])
          .map((k) => String(foundItem[k]))
          .join('#');
        existingKeySet.add(idStr);
      });
    } catch (err) {
      if (err.name === 'ResourceNotFoundException') {
        throw err;
      }
      console.warn(`[BatchGet] Warning on ${tableName}: ${err.message}`);
    }
  }

  return existingKeySet;
}

async function safeBatchWrite(tableName, items) {
  const CHUNK_SIZE = 25;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const putRequests = chunk.map((item) => ({
      PutRequest: { Item: item },
    }));

    try {
      const command = new BatchWriteCommand({
        RequestItems: {
          [tableName]: putRequests,
        },
      });

      const response = await docClient.send(command);
      let unprocessed = response.UnprocessedItems?.[tableName] || [];
      let backoffMs = 100;
      let retries = 0;

      while (unprocessed.length > 0 && retries < 5) {
        await new Promise((r) => setTimeout(r, backoffMs));
        backoffMs *= 2;
        retries++;
        const retryCmd = new BatchWriteCommand({
          RequestItems: { [tableName]: unprocessed },
        });
        const retryRes = await docClient.send(retryCmd);
        unprocessed = retryRes.UnprocessedItems?.[tableName] || [];
      }

      if (unprocessed.length > 0) {
        failed += unprocessed.length;
        inserted += chunk.length - unprocessed.length;
      } else {
        inserted += chunk.length;
      }
    } catch (err) {
      console.error(`[BatchWrite] Error writing to ${tableName}: ${err.message}`);
      failed += chunk.length;
    }
  }

  return { inserted, failed };
}

async function seedTable(tableName, items, keyFn, keyIdFn) {
  const stats = {
    total: items.length,
    inserted: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    const existingKeySet = await filterExistingKeys(tableName, items, keyFn);
    const itemsToInsert = [];

    items.forEach((item) => {
      const idStr = keyIdFn(item);
      if (existingKeySet.has(idStr)) {
        stats.skipped++;
      } else {
        itemsToInsert.push(item);
      }
    });

    if (itemsToInsert.length > 0) {
      const { inserted, failed } = await safeBatchWrite(tableName, itemsToInsert);
      stats.inserted += inserted;
      stats.failed += failed;
    }
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      stats.error = `Table "${tableName}" not found in region ${REGION}. Please create table if not already present.`;
      stats.failed = items.length;
    } else {
      stats.error = err.message;
      stats.failed = items.length;
    }
  }

  return stats;
}

export const handler = async (event = {}, context = {}) => {
  console.log('--- Starting FitResQ DynamoDB Seeder Lambda ---');
  console.log(`AWS Region: ${REGION}`);

  const dryRun = Boolean(event.dryRun);

  // 1. Read bundled dataset
  const customers = loadBundledData('./data/customers.json');
  const orders = loadBundledData('./data/orders.json');
  const refunds = loadBundledData('./data/refunds.json');
  const cases = loadBundledData('./data/cases.json');
  const messages = loadBundledData('./data/messages.json');

  console.log(`Loaded dataset: ${customers.length} customers, ${orders.length} orders, ${refunds.length} refunds, ${cases.length} cases, ${messages.length} messages.`);

  if (dryRun) {
    console.log('Dry run requested. No writes performed.');
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'DRY_RUN_COMPLETED',
        region: REGION,
        customers: { total: customers.length, inserted: 0, skipped: 0, failed: 0 },
        orders: { total: orders.length, inserted: 0, skipped: 0, failed: 0 },
        refunds: { total: refunds.length, inserted: 0, skipped: 0, failed: 0 },
        cases: { total: cases.length, inserted: 0, skipped: 0, failed: 0 },
        messages: { total: messages.length, inserted: 0, skipped: 0, failed: 0 },
      }),
    };
  }

  // 2. Perform safe seed
  const userStats = await seedTable(
    TABLE_NAMES.USERS,
    customers,
    (c) => ({ userId: c.userId }),
    (c) => String(c.userId)
  );

  const orderStats = await seedTable(
    TABLE_NAMES.ORDERS,
    orders,
    (o) => ({ orderId: o.orderId }),
    (o) => String(o.orderId)
  );

  const refundStats = await seedTable(
    TABLE_NAMES.REFUNDS,
    refunds,
    (r) => ({ orderId: r.orderId }),
    (r) => String(r.orderId)
  );

  const caseStats = await seedTable(
    TABLE_NAMES.CASES,
    cases,
    (k) => ({ caseId: k.caseId }),
    (k) => String(k.caseId)
  );

  const messageStats = await seedTable(
    TABLE_NAMES.MESSAGES,
    messages,
    (m) => ({ caseId: m.caseId, messageKey: m.messageKey }),
    (m) => `${m.caseId}#${m.messageKey}`
  );

  const overallStatus =
    userStats.failed === 0 &&
    orderStats.failed === 0 &&
    refundStats.failed === 0 &&
    caseStats.failed === 0 &&
    messageStats.failed === 0
      ? 'SUCCESS'
      : 'PARTIAL_SUCCESS';

  const responseBody = {
    status: overallStatus,
    region: REGION,
    customers: userStats,
    orders: orderStats,
    refunds: refundStats,
    cases: caseStats,
    messages: messageStats,
  };

  console.log('Seeder completed:', JSON.stringify(responseBody));

  return {
    statusCode: overallStatus === 'SUCCESS' ? 200 : 207,
    body: JSON.stringify(responseBody),
  };
};
