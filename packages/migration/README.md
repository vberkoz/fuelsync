# FuelSync Migration Tool

Migrate SQLite database to DynamoDB with proper data mapping.

## Features

- Maps SQLite tables to DynamoDB single-table design
- Converts expense category IDs to English names
- Sets Diesel fuel type for all vehicles and refills
- Converts all numeric values to 2 decimal precision
- Maps vehicle-specific details (year, model, license plate)
- Uses UAH currency for all transactions

## Usage

1. Update `USER_ID` and `DB_PATH` in `index.js`
2. Run migration:

```bash
npm run migrate
```

## Data Mapping

**Vehicles**: `cars` → `VEHICLE#` items with make, model, year, licensePlate, fuelType
**Refills**: `refills` → `REFILL#` items with odometer, volume, pricePerUnit, totalCost, fuelType, currency
**Expenses**: `costs` → `EXPENSE#` items with category (mapped from ID), amount, currency, odometer, description

## Expense Categories

| ID | Russian | English |
|----|---------|----------|
| 0 | Другое | Other |
| 1 | Аксессуары | Accessories |
| 2 | Запчасти | Parts |
| 3 | Кредит | Loan |
| 4 | Лицензия | License |
| 5 | Парковка | Parking |
| 6 | Регистрация | Registration |
| 7 | Сервис | Service |
| 8 | Страхование | Insurance |
| 9 | Штрафы | Fines |
| 10 | Мойка | Wash |
| 11 | Налог | Tax |
