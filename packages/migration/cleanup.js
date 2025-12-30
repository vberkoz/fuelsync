#!/usr/bin/env node
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ profile: 'basil' });
const docClient = DynamoDBDocumentClient.from(client);

async function cleanup() {
  const result = await docClient.send(new ScanCommand({
    TableName: 'FuelSyncTable',
    FilterExpression: 'begins_with(PK, :user) OR begins_with(PK, :vehicle)',
    ExpressionAttributeValues: { 
      ':user': 'USER#94788478-8001-7025-6795-71b7af2a06c9',
      ':vehicle': 'VEHICLE#'
    }
  }));

  for (const item of result.Items) {
    await docClient.send(new DeleteCommand({
      TableName: 'FuelSyncTable',
      Key: { PK: item.PK, SK: item.SK }
    }));
    console.log(`Deleted ${item.PK} ${item.SK}`);
  }
  
  console.log(`Cleanup completed! Deleted ${result.Items.length} items`);
}

cleanup().catch(console.error);
