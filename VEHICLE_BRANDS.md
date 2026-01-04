# Vehicle Brands Feature

## Overview
Added HeadlessUI Combobox for vehicle brand selection with 60+ predefined brands stored in DynamoDB.

## Implementation

### 1. Backend
- **Lambda Handler**: `packages/api/src/handlers/getBrands.ts` - Fetches brands from DynamoDB
- **Seed Script**: `packages/api/scripts/seed-brands.ts` - Seeds 60+ brands into DynamoDB
- **API Endpoint**: `GET /brands` (public, no auth required)
- **DynamoDB Record**: Single config record with PK/SK: `CONFIG#BRANDS`

### 2. Frontend
- **Combobox Component**: HeadlessUI Combobox in `Vehicles.tsx`
- **Features**:
  - Autocomplete with fuzzy search
  - Dropdown with all brands
  - Custom input allowed
  - Consistent styling with existing UI

### 3. Infrastructure
- Added `getBrands` Lambda function to CDK stack
- Added `/brands` API Gateway endpoint
- Granted DynamoDB read permissions

## Deployment

### 1. Deploy Infrastructure
```bash
cd packages/infrastructure
npx cdk deploy --profile basil
```

### 2. Seed Brands
```bash
cd packages/api
AWS_PROFILE=basil TABLE_NAME=FuelSyncTable npm run seed-brands
```

### 3. Rebuild Frontend
```bash
cd packages/app
npm run build
```

## Brand List (60 brands)
Acura, Alfa Romeo, Aston Martin, Audi, Bentley, BMW, Bugatti, Buick, Cadillac, Chevrolet, Chrysler, Citroën, Dacia, Daewoo, Daihatsu, Dodge, Ferrari, Fiat, Ford, Genesis, GMC, Honda, Hummer, Hyundai, Infiniti, Isuzu, Jaguar, Jeep, Kia, Lamborghini, Lancia, Land Rover, Lexus, Lincoln, Lotus, Maserati, Maybach, Mazda, McLaren, Mercedes-Benz, Mercury, Mini, Mitsubishi, Nissan, Opel, Peugeot, Pontiac, Porsche, Ram, Renault, Rolls-Royce, Saab, Saturn, Scion, Seat, Skoda, Smart, Subaru, Suzuki, Tesla, Toyota, Volkswagen, Volvo

## Usage
1. Click "Add Vehicle" button
2. Start typing in the "Make" field
3. Select from dropdown or enter custom brand
4. Complete other fields and save
