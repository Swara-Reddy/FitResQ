/**
 * FitResQ DynamoDB Refund Request Sync Script
 * Attempts to persist refund request case, SLA, and audit records to AWS DynamoDB in ap-south-1.
 * Safely falls back if AWS credentials or tables are not reachable locally.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'ap-south-1';
const TABLE_CASES = process.env.CASES_TABLE || 'FitResQCases';
const TABLE_SLA = process.env.SLA_TABLE || 'FitResQSLA';
const TABLE_AUDIT = process.env.AUDIT_TABLE || 'FitResQAudit';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    process.exit(0);
  }

  let payload;
  try {
    payload = JSON.parse(args[0]);
  } catch (err) {
    console.error('Failed to parse sync payload:', err.message);
    process.exit(1);
  }

  const { caseRecord, slaRecord, auditRecord } = payload;

  try {
    const client = new DynamoDBClient({ region: REGION, maxAttempts: 2 });
    const docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });

    if (caseRecord) {
      try {
        await docClient.send(new PutCommand({ TableName: TABLE_CASES, Item: caseRecord }));
        console.log(`[DynamoDB] Successfully synced case ${caseRecord.caseId} to ${TABLE_CASES}`);
      } catch (err) {
        console.warn(`[DynamoDB] Note: Could not sync to ${TABLE_CASES} (${err.message})`);
      }
    }

    if (slaRecord) {
      try {
        await docClient.send(new PutCommand({ TableName: TABLE_SLA, Item: slaRecord }));
        console.log(`[DynamoDB] Successfully synced SLA record for ${slaRecord.caseId} to ${TABLE_SLA}`);
      } catch (err) {
        console.warn(`[DynamoDB] Note: Could not sync to ${TABLE_SLA} (${err.message})`);
      }
    }

    if (auditRecord) {
      try {
        await docClient.send(new PutCommand({ TableName: TABLE_AUDIT, Item: auditRecord }));
        console.log(`[DynamoDB] Successfully synced audit record ${auditRecord.auditId} to ${TABLE_AUDIT}`);
      } catch (err) {
        console.warn(`[DynamoDB] Note: Could not sync to ${TABLE_AUDIT} (${err.message})`);
      }
    }
  } catch (err) {
    console.warn(`[DynamoDB Sync Notice] AWS client error: ${err.message}`);
  }
}

main();
