const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || 'FuelSyncTable';
const USER_ID = process.env.USER_ID || 'test-user-123';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function seedData() {
  console.log('Starting seed process...\n');

  // Step 1: Create Vehicle 1
  const vehicle1Id = randomUUID();
  const vehicle1 = {
    PK: `USER#${USER_ID}`,
    SK: `VEHICLE#${vehicle1Id}`,
    GSI1PK: `VEHICLE#${vehicle1Id}`,
    GSI1SK: `USER#${USER_ID}`,
    vehicleId: vehicle1Id,
    userId: USER_ID,
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    licensePlate: 'ABC123',
    fuelType: 'Regular 87',
    tankCapacity: 15.8,
    createdAt: new Date().toISOString()
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: vehicle1 }));
  console.log('✓ Created Vehicle 1: Toyota Camry 2020');
  await sleep(200);

  // Step 2: Create Vehicle 2
  const vehicle2Id = randomUUID();
  const vehicle2 = {
    PK: `USER#${USER_ID}`,
    SK: `VEHICLE#${vehicle2Id}`,
    GSI1PK: `VEHICLE#${vehicle2Id}`,
    GSI1SK: `USER#${USER_ID}`,
    vehicleId: vehicle2Id,
    userId: USER_ID,
    make: 'Honda',
    model: 'Civic',
    year: 2019,
    licensePlate: 'XYZ789',
    fuelType: 'Regular 87',
    tankCapacity: 12.4,
    createdAt: new Date().toISOString()
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: vehicle2 }));
  console.log('✓ Created Vehicle 2: Honda Civic 2019');
  await sleep(200);

  // Step 3: Create Refill 1 for Vehicle 1
  const refill1V1Timestamp = Date.now() - 86400000 * 10;
  const refill1V1Id = randomUUID();
  const refill1V1 = {
    PK: `VEHICLE#${vehicle1Id}`,
    SK: `REFILL#${refill1V1Timestamp}#${refill1V1Id}`,
    vehicleId: vehicle1Id,
    userId: USER_ID,
    refillId: refill1V1Id,
    timestamp: refill1V1Timestamp,
    odometer: 25000,
    volume: 12.5,
    pricePerUnit: 3.45,
    totalCost: 43.13,
    fuelType: 'Regular 87',
    station: 'Shell Station'
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: refill1V1 }));
  console.log('✓ Created Refill 1 for Vehicle 1');
  await sleep(200);

  // Step 4: Create Refill 2 for Vehicle 1
  const refill2V1Timestamp = Date.now() - 86400000 * 5;
  const refill2V1Id = randomUUID();
  const refill2V1 = {
    PK: `VEHICLE#${vehicle1Id}`,
    SK: `REFILL#${refill2V1Timestamp}#${refill2V1Id}`,
    vehicleId: vehicle1Id,
    userId: USER_ID,
    refillId: refill2V1Id,
    timestamp: refill2V1Timestamp,
    odometer: 25350,
    volume: 11.8,
    pricePerUnit: 3.52,
    totalCost: 41.54,
    fuelType: 'Regular 87',
    station: 'BP Gas'
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: refill2V1 }));
  console.log('✓ Created Refill 2 for Vehicle 1');
  await sleep(200);

  // Step 5: Create Refill 3 for Vehicle 1
  const refill3V1Timestamp = Date.now();
  const refill3V1Id = randomUUID();
  const refill3V1 = {
    PK: `VEHICLE#${vehicle1Id}`,
    SK: `REFILL#${refill3V1Timestamp}#${refill3V1Id}`,
    vehicleId: vehicle1Id,
    userId: USER_ID,
    refillId: refill3V1Id,
    timestamp: refill3V1Timestamp,
    odometer: 25680,
    volume: 13.2,
    pricePerUnit: 3.48,
    totalCost: 45.94,
    fuelType: 'Regular 87',
    station: 'Chevron'
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: refill3V1 }));
  console.log('✓ Created Refill 3 for Vehicle 1');
  await sleep(200);

  // Step 6: Create Refill 1 for Vehicle 2
  const refill1V2Timestamp = Date.now() - 86400000 * 12;
  const refill1V2Id = randomUUID();
  const refill1V2 = {
    PK: `VEHICLE#${vehicle2Id}`,
    SK: `REFILL#${refill1V2Timestamp}#${refill1V2Id}`,
    vehicleId: vehicle2Id,
    userId: USER_ID,
    refillId: refill1V2Id,
    timestamp: refill1V2Timestamp,
    odometer: 42000,
    volume: 10.5,
    pricePerUnit: 3.42,
    totalCost: 35.91,
    fuelType: 'Regular 87',
    station: 'Exxon'
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: refill1V2 }));
  console.log('✓ Created Refill 1 for Vehicle 2');
  await sleep(200);

  // Step 7: Create Refill 2 for Vehicle 2
  const refill2V2Timestamp = Date.now() - 86400000 * 6;
  const refill2V2Id = randomUUID();
  const refill2V2 = {
    PK: `VEHICLE#${vehicle2Id}`,
    SK: `REFILL#${refill2V2Timestamp}#${refill2V2Id}`,
    vehicleId: vehicle2Id,
    userId: USER_ID,
    refillId: refill2V2Id,
    timestamp: refill2V2Timestamp,
    odometer: 42380,
    volume: 11.2,
    pricePerUnit: 3.49,
    totalCost: 39.09,
    fuelType: 'Regular 87',
    station: 'Shell Station'
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: refill2V2 }));
  console.log('✓ Created Refill 2 for Vehicle 2');
  await sleep(200);

  // Step 8: Create Refill 3 for Vehicle 2
  const refill3V2Timestamp = Date.now() - 86400000;
  const refill3V2Id = randomUUID();
  const refill3V2 = {
    PK: `VEHICLE#${vehicle2Id}`,
    SK: `REFILL#${refill3V2Timestamp}#${refill3V2Id}`,
    vehicleId: vehicle2Id,
    userId: USER_ID,
    refillId: refill3V2Id,
    timestamp: refill3V2Timestamp,
    odometer: 42720,
    volume: 10.8,
    pricePerUnit: 3.51,
    totalCost: 37.91,
    fuelType: 'Regular 87',
    station: 'BP Gas'
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: refill3V2 }));
  console.log('✓ Created Refill 3 for Vehicle 2');
  await sleep(200);

  // Step 9: Create Expense 1 for Vehicle 1
  const expense1V1Timestamp = Date.now() - 86400000 * 15;
  const expense1V1Id = randomUUID();
  const expense1V1 = {
    PK: `VEHICLE#${vehicle1Id}`,
    SK: `EXPENSE#${expense1V1Timestamp}#${expense1V1Id}`,
    vehicleId: vehicle1Id,
    userId: USER_ID,
    expenseId: expense1V1Id,
    timestamp: expense1V1Timestamp,
    category: 'Maintenance',
    amount: 45.99,
    odometer: 24800,
    description: 'Oil change and filter replacement'
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: expense1V1 }));
  console.log('✓ Created Expense 1 for Vehicle 1');
  await sleep(200);

  // Step 10: Create Expense 2 for Vehicle 1
  const expense2V1Timestamp = Date.now() - 86400000 * 8;
  const expense2V1Id = randomUUID();
  const expense2V1 = {
    PK: `VEHICLE#${vehicle1Id}`,
    SK: `EXPENSE#${expense2V1Timestamp}#${expense2V1Id}`,
    vehicleId: vehicle1Id,
    userId: USER_ID,
    expenseId: expense2V1Id,
    timestamp: expense2V1Timestamp,
    category: 'Repair',
    amount: 125.50,
    odometer: 25100,
    description: 'Brake pad replacement'
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: expense2V1 }));
  console.log('✓ Created Expense 2 for Vehicle 1');
  await sleep(200);

  // Step 11: Create Expense 3 for Vehicle 1
  const expense3V1Timestamp = Date.now() - 86400000 * 2;
  const expense3V1Id = randomUUID();
  const expense3V1 = {
    PK: `VEHICLE#${vehicle1Id}`,
    SK: `EXPENSE#${expense3V1Timestamp}#${expense3V1Id}`,
    vehicleId: vehicle1Id,
    userId: USER_ID,
    expenseId: expense3V1Id,
    timestamp: expense3V1Timestamp,
    category: 'Wash',
    amount: 15.00,
    odometer: 25600,
    description: 'Car wash and interior cleaning'
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: expense3V1 }));
  console.log('✓ Created Expense 3 for Vehicle 1');
  await sleep(200);

  // Step 12: Create Expense 1 for Vehicle 2
  const expense1V2Timestamp = Date.now() - 86400000 * 20;
  const expense1V2Id = randomUUID();
  const expense1V2 = {
    PK: `VEHICLE#${vehicle2Id}`,
    SK: `EXPENSE#${expense1V2Timestamp}#${expense1V2Id}`,
    vehicleId: vehicle2Id,
    userId: USER_ID,
    expenseId: expense1V2Id,
    timestamp: expense1V2Timestamp,
    category: 'Insurance',
    amount: 450.00,
    odometer: 41500,
    description: 'Monthly insurance premium'
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: expense1V2 }));
  console.log('✓ Created Expense 1 for Vehicle 2');
  await sleep(200);

  // Step 13: Create Expense 2 for Vehicle 2
  const expense2V2Timestamp = Date.now() - 86400000 * 10;
  const expense2V2Id = randomUUID();
  const expense2V2 = {
    PK: `VEHICLE#${vehicle2Id}`,
    SK: `EXPENSE#${expense2V2Timestamp}#${expense2V2Id}`,
    vehicleId: vehicle2Id,
    userId: USER_ID,
    expenseId: expense2V2Id,
    timestamp: expense2V2Timestamp,
    category: 'Maintenance',
    amount: 89.99,
    odometer: 42100,
    description: 'Tire rotation and alignment'
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: expense2V2 }));
  console.log('✓ Created Expense 2 for Vehicle 2');
  await sleep(200);

  // Step 14: Create Expense 3 for Vehicle 2
  const expense3V2Timestamp = Date.now() - 86400000 * 3;
  const expense3V2Id = randomUUID();
  const expense3V2 = {
    PK: `VEHICLE#${vehicle2Id}`,
    SK: `EXPENSE#${expense3V2Timestamp}#${expense3V2Id}`,
    vehicleId: vehicle2Id,
    userId: USER_ID,
    expenseId: expense3V2Id,
    timestamp: expense3V2Timestamp,
    category: 'Parking',
    amount: 25.00,
    odometer: 42650,
    description: 'Airport parking fee'
  };
  
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: expense3V2 }));
  console.log('✓ Created Expense 3 for Vehicle 2');

  console.log('\n✅ Seed completed successfully!');
  console.log(`\nSummary:`);
  console.log(`- 2 vehicles created`);
  console.log(`- 6 refills created (3 per vehicle)`);
  console.log(`- 6 expenses created (3 per vehicle)`);
  console.log(`\nUser ID: ${USER_ID}`);
  console.log(`Vehicle 1 ID: ${vehicle1Id}`);
  console.log(`Vehicle 2 ID: ${vehicle2Id}`);
}

seedData().catch(console.error);
