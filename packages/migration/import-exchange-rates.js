const fs = require('fs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const CSV_FILE = '/Users/basilsergius/Downloads/USD_UAH Historical Data.csv';
const TABLE_NAME = 'FuelSyncTable';
const REGION = 'us-east-1';

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

function parseCSV(content) {
  const lines = content.split('\n').slice(1); // Skip header
  const rates = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    
    const match = line.match(/"([^"]+)","([^"]+)"/);
    if (!match) continue;

    const [, dateStr, priceStr] = match;
    const date = parseDate(dateStr);
    const rate = parseFloat(priceStr);

    if (date && !isNaN(rate)) {
      rates.push({ date, rate });
    }
  }

  return rates;
}

function parseDate(dateStr) {
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

async function importRates(rates) {
  console.log(`Importing ${rates.length} exchange rates...`);
  let imported = 0;

  for (const { date, rate } of rates) {
    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `EXCHANGE_RATE#${date}`,
            SK: 'RATES',
            rates: { UAH: rate },
            lastUpdated: new Date(date).getTime(),
          },
        })
      );
      imported++;
      if (imported % 50 === 0) {
        console.log(`Imported ${imported}/${rates.length}...`);
      }
    } catch (error) {
      console.error(`Failed to import ${date}:`, error.message);
    }
  }

  console.log(`✅ Successfully imported ${imported} rates`);
}

async function main() {
  const content = fs.readFileSync(CSV_FILE, 'utf-8');
  const rates = parseCSV(content);
  await importRates(rates);
}

main().catch(console.error);
