#!/usr/bin/env node
const Database = require('better-sqlite3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const DB_PATH = '/Users/basilsergius/Downloads/Топливомер_БД_20221120_160204_1281347789493688515.db3';
const DYNAMODB_TABLE = 'FuelSyncTable';
const USER_ID = '94788478-8001-7025-6795-71b7af2a06c9'; // vberkoz@vf-soft.com

const client = new DynamoDBClient({ profile: 'basil' });
const docClient = DynamoDBDocumentClient.from(client);

async function migrate() {
  const db = new Database(DB_PATH, { readonly: true });

  // Map old car IDs to new vehicle UUIDs
  const vehicleMap = new Map();

  // cars -> vehicles
  for (const row of db.prepare('SELECT * FROM cars').all()) {
    const vehicleId = randomUUID();
    vehicleMap.set(row._id, vehicleId);
    await docClient.send(new PutCommand({
      TableName: DYNAMODB_TABLE,
      Item: {
        PK: `USER#${USER_ID}`,
        SK: `VEHICLE#${vehicleId}`,
        vehicleId,
        make: row.brand || '',
        model: row.model || '',
        fuelType: 'gasoline',
        comment: row.comment || ''
      }
    }));
  }

  // refills
  for (const row of db.prepare('SELECT * FROM refills').all()) {
    const refillId = randomUUID();
    const timestamp = row.time || Date.now();
    const vehicleId = vehicleMap.get(row.car);
    await docClient.send(new PutCommand({
      TableName: DYNAMODB_TABLE,
      Item: {
        PK: `VEHICLE#${vehicleId}`,
        SK: `REFILL#${timestamp}#${refillId}`,
        refillId,
        odometer: Number(row.odometer) || 0,
        volume: Number(row.amount) || 0,
        pricePerUnit: Number(row.price) || 0,
        totalCost: Number(row.sum) || 0,
        timestamp: row.time || Date.now(),
        comment: row.comment || ''
      }
    }));
  }

  // costs -> expenses
  for (const row of db.prepare('SELECT * FROM costs').all()) {
    const expenseId = randomUUID();
    const timestamp = row.time || Date.now();
    const vehicleId = vehicleMap.get(row.car_id);
    await docClient.send(new PutCommand({
      TableName: DYNAMODB_TABLE,
      Item: {
        PK: `VEHICLE#${vehicleId}`,
        SK: `EXPENSE#${timestamp}#${expenseId}`,
        expenseId,
        category: row.type || 'other',
        amount: Number(row.sum) || 0,
        odometer: Number(row.odometer) || 0,
        description: row.title || '',
        timestamp: row.time || Date.now(),
        comment: row.comment || ''
      }
    }));
  }

  db.close();
  console.log('Migration completed!');
}

migrate().catch(console.error);
