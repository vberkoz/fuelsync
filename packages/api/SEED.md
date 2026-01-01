# Seed Script

Seeds DynamoDB with test data for development.

## Usage

```bash
# Set your user ID (optional, defaults to 'test-user-123')
export USER_ID="d418a428-5071-7038-0c49-e352a6649773"

# Set table name (optional, defaults to 'FuelSyncTable')
export TABLE_NAME="FuelSyncTable"

# Run the seed script
npm run seed

AWS_PROFILE=basil TABLE_NAME="FuelSyncTable" USER_ID="d418a428-5071-7038-0c49-e352a6649773" npm run seed
```

## What it creates

The script makes 14 sequential operations with 200ms delays between each:

1. **Vehicle 1**: Toyota Camry 2020
2. **Vehicle 2**: Honda Civic 2019
3. **3 Refills for Vehicle 1** (10 days ago, 5 days ago, today)
4. **3 Refills for Vehicle 2** (12 days ago, 6 days ago, yesterday)
5. **3 Expenses for Vehicle 1** (Maintenance, Repair, Wash)
6. **3 Expenses for Vehicle 2** (Insurance, Maintenance, Parking)

Total: 2 vehicles, 6 refills, 6 expenses

## AWS Profile

If using a specific AWS profile:

```bash
AWS_PROFILE=basil npm run seed
```
