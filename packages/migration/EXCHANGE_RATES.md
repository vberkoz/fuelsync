# Exchange Rate Import

Import historical USD/UAH exchange rates from CSV into DynamoDB.

## How It Works

1. **Historical Data**: Import CSV data into DynamoDB with date-based keys
2. **Live Extension**: The app automatically fetches current rates from er-api.com
3. **Seamless Lookup**: The utility checks cache first, then API for today's rate

## Import Historical Data

```bash
cd packages/migration
AWS_PROFILE=basil npm run import-rates
```

This will:
- Parse the CSV file (Date, Price format)
- Convert dates to ISO format (YYYY-MM-DD)
- Store each rate in DynamoDB with key `EXCHANGE_RATE#{date}`
- Import all historical records

## Data Structure

Each exchange rate record in DynamoDB:
```json
{
  "PK": "EXCHANGE_RATE#2025-12-31",
  "SK": "RATES",
  "rates": {
    "UAH": 42.1764
  },
  "lastUpdated": 1735689600000
}
```

## Usage in App

The exchange rate utility now supports historical lookups:

```typescript
// Get today's rate (fetches from API if not cached)
const rate = await getExchangeRate('UAH');

// Get historical rate (uses imported data)
const historicalRate = await getExchangeRate('UAH', '2025-12-31');
```

## Benefits

- ✅ Historical data available for past transactions
- ✅ No API limits for historical lookups
- ✅ Automatic extension with live data for current dates
- ✅ Consistent data structure across all dates
