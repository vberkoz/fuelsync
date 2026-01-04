import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { readFileSync } from 'fs';
import { join } from 'path';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const brandsWithLogos = JSON.parse(readFileSync(join(__dirname, 'brands-with-logos.json'), 'utf-8'));

async function seedBrands() {
  const tableName = process.env.TABLE_NAME || 'FuelSyncTable';
  
  await docClient.send(new PutCommand({
    TableName: tableName,
    Item: {
      PK: 'CONFIG#BRANDS',
      SK: 'CONFIG#BRANDS',
      brands: brandsWithLogos,
      updatedAt: Date.now()
    }
  }));
  
  console.log(`✅ Seeded ${brandsWithLogos.length} vehicle brands with logos`);
}

seedBrands().catch(console.error);
