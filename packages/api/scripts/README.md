# How to Scrape Vehicle Brands from carlogos.org

## Quick Start

### 1. Scrape brands from website
```bash
cd packages/api
node scripts/scrape-brands-clean.js > scripts/brands.json
```

This will:
- Fetch https://www.carlogos.org/car-brands-a-z/
- Extract all vehicle brand names
- Filter out categories (Europe, USA, etc.)
- Decode HTML entities (ë, Š, &)
- Save ~377 brands to `scripts/brands.json`

### 2. Seed to DynamoDB
```bash
AWS_PROFILE=basil TABLE_NAME=FuelSyncTable npm run seed-brands
```

## Files

- `scripts/scrape-brands-clean.js` - Web scraper (Node.js)
- `scripts/brands.json` - Scraped brands (377 brands)
- `scripts/seed-brands.ts` - DynamoDB seeder (reads brands.json)

## Update Brands

To refresh the brand list:
```bash
cd packages/api
node scripts/scrape-brands-clean.js > scripts/brands.json
AWS_PROFILE=basil TABLE_NAME=FuelSyncTable npm run seed-brands
```

## Scraper Details

**Source**: https://www.carlogos.org/car-brands-a-z/

**Pattern**: Extracts from `<dd><a>Brand Name</a></dd>` tags

**Filters**: Removes categories like "Europe", "USA", "Quizzes", etc.

**HTML Entities**: Converts `&euml;` → `ë`, `&Scaron;` → `Š`, `&amp;` → `&`
