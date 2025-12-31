#!/usr/bin/env node
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const OLD_USER_ID = '94788478-8001-7025-6795-71b7af2a06c9';
const NEW_USER_ID = '8488e4f8-2051-7066-fd78-22f39fcab599';
const TABLE_NAME = 'FuelSyncTable';

const client = new DynamoDBClient({ profile: 'basil' });
const docClient = DynamoDBDocumentClient.from(client);

async function copyData() {
  // Get all vehicles
  const vehiclesResult = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${OLD_USER_ID}`,
      ':sk': 'VEHICLE#'
    }
  }));

  console.log(`Copying ${vehiclesResult.Items.length} vehicles...`);
  
  for (const vehicle of vehiclesResult.Items) {
    const newItem = { ...vehicle, PK: `USER#${NEW_USER_ID}` };
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: newItem
    }));
    console.log(`Copied vehicle: ${vehicle.vehicleId}`);

    // Copy refills
    const refillsResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `VEHICLE#${vehicle.vehicleId}`,
        ':sk': 'REFILL#'
      }
    }));

    console.log(`  Copying ${refillsResult.Items.length} refills...`);
    for (const refill of refillsResult.Items) {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: refill
      }));
    }

    // Copy expenses
    const expensesResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `VEHICLE#${vehicle.vehicleId}`,
        ':sk': 'EXPENSE#'
      }
    }));

    console.log(`  Copying ${expensesResult.Items.length} expenses...`);
    for (const expense of expensesResult.Items) {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: expense
      }));
    }
  }

  console.log('Copy completed!');
}

copyData().catch(console.error);
