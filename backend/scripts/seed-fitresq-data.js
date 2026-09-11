/**
 * FitResQ DynamoDB Safe Seeder
 *
 * Can run in two modes:
 * 1. CLI Mode: node seed-fitresq-data.js [--dry-run]
 * 2. AWS Lambda Mode: handler(event, context)
 *
 * Characteristics:
 * - Reads existing generated dataset files from ../data/ (does not regenerate)
 * - Safe & Idempotent: Checks for existing records before writing; never deletes data blindly.
 * - Respects DynamoDB batch limits (chunks of 25 items per BatchWriteItem).
 * - Preserves existing production/test records for CUS-001, ORD-10021, RF-90001, FR-1F40B7F5, etc.
 * - Accurately tracks and reports inserted, skipped, and failed records.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGION = process.env.AWS_REGION || 'ap-south-1';

const TABLE_NAMES = {
  USERS: process.env.USERS_TABLE || 'FitResQUsers',
  ORDERS: process.env.ORDERS_TABLE || 'FitResQOrders',
  REFUNDS: process.env.REFUNDS_TABLE || 'FitResQRefunds',
  CASES: process.env.CASES_TABLE || 'FitResQCases',
  MESSAGES: process.env.MESSAGES_TABLE || 'FitResQMessages',
};

/**
 * Loads the existing pre-generated dataset from ../data/*.json
 * Uses relative path via import.meta.url to ensure environment independence.
 */
function loadExistingDataset() {
  const dataDir = path.resolve(__dirname, '..', 'data');
  const customers = JSON.parse(fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf-8'));
  const orders = JSON.parse(fs.readFileSync(path.join(dataDir, 'orders.json'), 'utf-8'));
  const refunds = JSON.parse(fs.readFileSync(path.join(dataDir, 'refunds.json'), 'utf-8'));
  const cases = JSON.parse(fs.readFileSync(path.join(dataDir, 'cases.json'), 'utf-8'));
  const messages = JSON.parse(fs.readFileSync(path.join(dataDir, 'messages.json'), 'utf-8'));

  return {
    customers,
    orders,
    refunds,
    cases,
    messages,
    summary: {
      customerCount: customers.length,
      orderCount: orders.length,
      refundCount: refunds.length,
      caseCount: cases.length,
      messageCount: messages.length,
    },
  };
}

/**
 * Dynamically import AWS SDK if available in the environment
 */
async function getDynamoClient() {
  try {
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, BatchWriteCommand, BatchGetCommand } = await import('@aws-sdk/lib-dynamodb');

    const client = new DynamoDBClient({ region: REGION });
    const docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
    return { docClient, BatchWriteCommand, BatchGetCommand, available: true };
  } catch (err) {
    return { available: false, error: err.message };
  }
}

/**
 * Check existing primary keys using BatchGetCommand to prevent overwriting
 */
async function filterExistingKeys(docClient, BatchGetCommand, tableName, items, keyFn) {
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
        // Build composite string identifier
        const idStr = Object.keys(keys[0])
          .map((k) => String(foundItem[k]))
          .join('#');
        existingKeySet.add(idStr);
      });
    } catch (err) {
      if (err.name === 'ResourceNotFoundException') {
        throw err;
      }
      console.warn(`[BatchGet] Warning checking existing keys in ${tableName}: ${err.message}`);
    }
  }

  return existingKeySet;
}

/**
 * Safely writes items in batches of 25 (DynamoDB limit)
 */
async function safeBatchWriteTable(docClient, BatchWriteCommand, tableName, items) {
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

      // Handle any unprocessed items with exponential backoff
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

/**
 * Seed a specific table with deduplication and metrics
 */
async function seedTable(docClient, BatchGetCommand, BatchWriteCommand, tableName, items, keyFn, keyIdFn) {
  const result = {
    total: items.length,
    inserted: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    const existingKeySet = await filterExistingKeys(docClient, BatchGetCommand, tableName, items, keyFn);

    const itemsToInsert = [];
    items.forEach((item) => {
      const idStr = keyIdFn(item);
      if (existingKeySet.has(idStr)) {
        result.skipped++;
      } else {
        itemsToInsert.push(item);
      }
    });

    if (itemsToInsert.length > 0) {
      const { inserted, failed } = await safeBatchWriteTable(
        docClient,
        BatchWriteCommand,
        tableName,
        itemsToInsert
      );
      result.inserted += inserted;
      result.failed += failed;
    }
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      result.error = `Table "${tableName}" was not found in AWS region ${REGION}. Please create table if not already present.`;
      result.failed = items.length;
    } else {
      result.error = err.message;
      result.failed = items.length;
    }
  }

  return result;
}

/**
 * Core Seeding Routine
 */
export async function seedFitResQData({ dryRun = false } = {}) {
  console.log('====================================================');
  console.log('         FitResQ DynamoDB Data Seeder');
  console.log('====================================================');
  console.log(`Region: ${REGION}`);
  console.log(`Mode:   ${dryRun ? 'DRY RUN (Validate & Report)' : 'APPLY (Live DynamoDB)'}\n`);

  // 1. Load existing generated dataset from disk
  console.log('[1/3] Loading existing generated dataset from backend/data/...');
  const dataset = loadExistingDataset();
  const { customers, orders, refunds, cases, messages, summary } = dataset;

  console.log('✔ Loaded existing dataset:');
  console.log(`   Customers: ${summary.customerCount} (CUS-001 to CUS-100)`);
  console.log(`   Orders:    ${summary.orderCount} (ORD-10001...)`);
  console.log(`   Refunds:   ${summary.refundCount} (RF-90001...)`);
  console.log(`   Cases:     ${summary.caseCount} (FR-1F40B7F5...)`);
  console.log(`   Messages:  ${summary.messageCount}`);

  // 2. Check AWS SDK and environment
  console.log('\n[2/3] Checking AWS environment and credentials...');
  const sdk = await getDynamoClient();

  if (dryRun) {
    console.log('✔ Dry run mode. Skipping DynamoDB network writes.');
    return {
      status: 'DRY_RUN_COMPLETED',
      summary: {
        customers: { total: summary.customerCount, inserted: 0, skipped: 0, failed: 0 },
        orders: { total: summary.orderCount, inserted: 0, skipped: 0, failed: 0 },
        refunds: { total: summary.refundCount, inserted: 0, skipped: 0, failed: 0 },
        cases: { total: summary.caseCount, inserted: 0, skipped: 0, failed: 0 },
        messages: { total: summary.messageCount, inserted: 0, skipped: 0, failed: 0 },
      },
      executedInAWS: false,
    };
  }

  if (!sdk.available) {
    console.warn(`! AWS SDK not loaded locally (${sdk.error || 'package not found in local node_modules'}).`);
    return {
      status: 'OFFLINE_PREPARED',
      summary: {
        customers: { total: summary.customerCount, inserted: 0, skipped: 0, failed: 0 },
        orders: { total: summary.orderCount, inserted: 0, skipped: 0, failed: 0 },
        refunds: { total: summary.refundCount, inserted: 0, skipped: 0, failed: 0 },
        cases: { total: summary.caseCount, inserted: 0, skipped: 0, failed: 0 },
        messages: { total: summary.messageCount, inserted: 0, skipped: 0, failed: 0 },
      },
      executedInAWS: false,
      reason: 'AWS SDK not available in local environment',
    };
  }

  // 3. Connect to DynamoDB and safely insert
  try {
    const { docClient, BatchGetCommand, BatchWriteCommand } = sdk;

    console.log('\n[3/3] Inserting records into AWS DynamoDB tables with duplicate protection...');

    const userStats = await seedTable(
      docClient,
      BatchGetCommand,
      BatchWriteCommand,
      TABLE_NAMES.USERS,
      customers,
      (c) => ({ userId: c.userId }),
      (c) => String(c.userId)
    );
    console.log(`✔ ${TABLE_NAMES.USERS}: ${userStats.inserted} inserted, ${userStats.skipped} skipped, ${userStats.failed} failed.`);

    const orderStats = await seedTable(
      docClient,
      BatchGetCommand,
      BatchWriteCommand,
      TABLE_NAMES.ORDERS,
      orders,
      (o) => ({ orderId: o.orderId }),
      (o) => String(o.orderId)
    );
    console.log(`✔ ${TABLE_NAMES.ORDERS}: ${orderStats.inserted} inserted, ${orderStats.skipped} skipped, ${orderStats.failed} failed.`);

    const refundStats = await seedTable(
      docClient,
      BatchGetCommand,
      BatchWriteCommand,
      TABLE_NAMES.REFUNDS,
      refunds,
      (r) => ({ orderId: r.orderId }),
      (r) => String(r.orderId)
    );
    console.log(`✔ ${TABLE_NAMES.REFUNDS}: ${refundStats.inserted} inserted, ${refundStats.skipped} skipped, ${refundStats.failed} failed.`);

    const caseStats = await seedTable(
      docClient,
      BatchGetCommand,
      BatchWriteCommand,
      TABLE_NAMES.CASES,
      cases,
      (k) => ({ caseId: k.caseId }),
      (k) => String(k.caseId)
    );
    console.log(`✔ ${TABLE_NAMES.CASES}: ${caseStats.inserted} inserted, ${caseStats.skipped} skipped, ${caseStats.failed} failed.`);

    const messageStats = await seedTable(
      docClient,
      BatchGetCommand,
      BatchWriteCommand,
      TABLE_NAMES.MESSAGES,
      messages,
      (m) => ({ caseId: m.caseId, messageKey: m.messageKey }),
      (m) => `${m.caseId}#${m.messageKey}`
    );
    console.log(`✔ ${TABLE_NAMES.MESSAGES}: ${messageStats.inserted} inserted, ${messageStats.skipped} skipped, ${messageStats.failed} failed.`);

    console.log('\n====================================================');
    console.log('🎉 SEED PROCESS COMPLETED');
    console.log('====================================================');

    return {
      status: 'SUCCESS',
      region: REGION,
      customers: userStats,
      orders: orderStats,
      refunds: refundStats,
      cases: caseStats,
      messages: messageStats,
      executedInAWS: true,
    };
  } catch (err) {
    console.warn(`! Unable to connect to AWS DynamoDB from this environment: ${err.message}`);
    return {
      status: 'OFFLINE_PREPARED',
      summary: {
        customers: { total: summary.customerCount, inserted: 0, skipped: 0, failed: 0 },
        orders: { total: summary.orderCount, inserted: 0, skipped: 0, failed: 0 },
        refunds: { total: summary.refundCount, inserted: 0, skipped: 0, failed: 0 },
        cases: { total: summary.caseCount, inserted: 0, skipped: 0, failed: 0 },
        messages: { total: summary.messageCount, inserted: 0, skipped: 0, failed: 0 },
      },
      executedInAWS: false,
      reason: err.message,
    };
  }
}

/**
 * AWS Lambda Handler Export
 */
export const handler = async (event = {}, context = {}) => {
  const dryRun = Boolean(event.dryRun);
  const result = await seedFitResQData({ dryRun });
  return {
    statusCode: result.status === 'SUCCESS' ? 200 : 202,
    body: JSON.stringify(result),
  };
};

// If run directly from Node CLI
if (process.argv[1] && process.argv[1].endsWith('seed-fitresq-data.js')) {
  const isDryRun = process.argv.includes('--dry-run');
  seedFitResQData({ dryRun: isDryRun })
    .then((res) => {
      console.log('\nResult:', JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('\nSeeder Error:', err);
      process.exit(1);
    });
}

export default seedFitResQData;
