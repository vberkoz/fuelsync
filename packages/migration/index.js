#!/usr/bin/env node
const Database = require('better-sqlite3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const DB_PATH = '/Users/basilsergius/Downloads/Топливомер_БД_20221120_160204_1281347789493688515.db3';
const DYNAMODB_TABLE = 'FuelSyncTable';
const USER_ID = '8488e4f8-2051-7066-fd78-22f39fcab599'; // rikzgt1@gmail.com

const client = new DynamoDBClient({ profile: 'basil' });
const docClient = DynamoDBDocumentClient.from(client);

async function migrate() {
  const db = new Database(DB_PATH, { readonly: true });

  // Map old car IDs to new vehicle UUIDs
  const vehicleMap = new Map();

  // Get all refills and costs to determine vehicle creation dates
  const allRefills = db.prepare('SELECT car, time FROM refills ORDER BY time ASC').all();
  const allCosts = db.prepare('SELECT car_id, time FROM costs ORDER BY time ASC').all();
  
  // Calculate earliest date for each vehicle
  const vehicleCreationDates = new Map();
  for (const refill of allRefills) {
    if (!vehicleCreationDates.has(refill.car) || refill.time < vehicleCreationDates.get(refill.car)) {
      vehicleCreationDates.set(refill.car, refill.time);
    }
  }
  for (const cost of allCosts) {
    if (!vehicleCreationDates.has(cost.car_id) || cost.time < vehicleCreationDates.get(cost.car_id)) {
      vehicleCreationDates.set(cost.car_id, cost.time);
    }
  }

  // cars -> vehicles
  const cars = db.prepare('SELECT * FROM cars').all();
  console.log(`Migrating ${cars.length} vehicles...`);
  for (const [i, row] of cars.entries()) {
    const vehicleId = randomUUID();
    vehicleMap.set(row._id, vehicleId);
    
    // Set specific details based on make and model
    let year, model, licensePlate, make;
    
    if (row.brand === 'mercedes_benz' && row.model === 'S350') {
      year = '2011';
      model = 'W221';
      licensePlate = 'QW1233ER';
      make = 'Mercedes Benz';
    } else if (row.brand === 'mercedes_benz' && row.model === 'W210') {
      year = '1998';
      model = 'W210';
      licensePlate = 'QW1212QW';
      make = 'Mercedes Benz';
    } else {
      make = row.brand || '';
      model = row.model || '';
    }
    
    const createdAt = vehicleCreationDates.get(row._id) || Date.now();
    
    await docClient.send(new PutCommand({
      TableName: DYNAMODB_TABLE,
      Item: {
        PK: `USER#${USER_ID}`,
        SK: `VEHICLE#${vehicleId}`,
        vehicleId,
        make,
        model,
        year,
        licensePlate,
        fuelType: 'Diesel',
        comment: row.comment || '',
        createdAt
      }
    }));
    console.log(`Migrated vehicle ${i + 1}/${cars.length}: ${make} ${model}`);
  }

  // refills
  const refills = db.prepare('SELECT * FROM refills').all();
  console.log(`Migrating ${refills.length} refills...`);
  for (const [i, row] of refills.entries()) {
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
        volume: Number((Number(row.amount) || 0).toFixed(2)),
        pricePerUnit: Number((Number(row.price) || 0).toFixed(2)),
        totalCost: Number((Number(row.sum) || 0).toFixed(2)),
        fuelType: 'Diesel',
        currency: 'UAH',
        timestamp: row.time || Date.now(),
        comment: row.comment || ''
      }
    }));
    console.log(`Migrated refill ${i + 1}/${refills.length}`);
  }

  // costs -> expenses
  const costs = db.prepare('SELECT * FROM costs').all();
  console.log(`Migrating ${costs.length} expenses...`);
  
  const categoryMap = {
    0: 'Other',
    1: 'Accessories',
    2: 'Parts',
    3: 'Loan',
    4: 'License',
    5: 'Parking',
    6: 'Registration',
    7: 'Service',
    8: 'Insurance',
    9: 'Fines',
    10: 'Wash',
    11: 'Tax'
  };
  
  for (const [i, row] of costs.entries()) {
    const expenseId = randomUUID();
    const timestamp = row.time || Date.now();
    const vehicleId = vehicleMap.get(row.car_id);
    const category = categoryMap[row.type] || 'Other';
    
    await docClient.send(new PutCommand({
      TableName: DYNAMODB_TABLE,
      Item: {
        PK: `VEHICLE#${vehicleId}`,
        SK: `EXPENSE#${timestamp}#${expenseId}`,
        expenseId,
        category,
        amount: Number((Number(row.sum) || 0).toFixed(2)),
        currency: 'UAH',
        odometer: Number(row.odometer) || 0,
        description: row.comment || row.title || '',
        timestamp: row.time || Date.now()
      }
    }));
    console.log(`Migrated expense ${i + 1}/${costs.length}: ${category}`);
  }

  db.close();
  console.log('Migration completed!');
}

migrate().catch(console.error);
