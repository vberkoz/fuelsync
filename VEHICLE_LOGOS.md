# Vehicle Brand Logos Setup

## Complete Setup Process

### 1. Scrape brands from website
```bash
cd packages/api
node scripts/scrape-brands-clean.js > scripts/brands.json
```

### 2. Download all brand logos
```bash
npm run download-logos
```

This will:
- Download 377 logos from carlogos.org
- Save to `packages/app/public/logos/`
- Handle custom slug mappings for 19 brands
- Create `scripts/brands-with-logos.json` with mapping:
  ```json
  [
    {
      "name": "Mercedes-Benz",
      "slug": "mercedes-benz",
      "logo": "/logos/mercedes-benz.png"
    }
  ]
  ```

### 3. Seed brands with logos to DynamoDB
```bash
AWS_PROFILE=basil TABLE_NAME=FuelSyncTable npm run seed-brands
```

### 4. Deploy infrastructure (if needed)
```bash
cd packages/infrastructure
npx cdk deploy --profile basil
```

### 5. Rebuild and deploy frontend
```bash
cd packages/app
npm run build
```

## Custom Slug Mappings

19 brands have custom slug mappings:

```
ABT → abt-sportsline
AMC → american-motors
Atalanta → atalanta-motors
BAIC Motor → baic
Chevrolet Corvette → corvette
Citroën → citroen
DMC → delorean
Force Motors → force
Hindustan Motors → hindustan
IKCO → iran-khodro
JMC → jiangling
LEVC → london-ev-company
Li Auto → lixiang
Lynk & Co → lynkco
SAIC Motor → saic
Tauro → tauro-sport-auto
Zarooq Motors → zarooq
Zinoro → zhinuo
Škoda → skoda
```

## Logo URL Pattern

**Source**: `https://www.carlogos.org/car-logos/{slug}-logo.png`

**Slug format**: Lowercase, spaces to hyphens, special chars removed
- `Mercedes-Benz` → `mercedes-benz-logo.png`
- `Alfa Romeo` → `alfa-romeo-logo.png`
- `BMW` → `bmw-logo.png`

## Frontend Usage

Logos are displayed in:
1. **Sidebar** - Desktop vehicle selector (32x32px)
2. **Mobile Header** - Mobile vehicle selector (24x24px)
3. **Vehicle Form** - Brand combobox dropdown (20x20px)

## Files Structure

```
packages/
├── api/
│   └── scripts/
│       ├── scrape-brands-clean.js      # Scrape brand names
│       ├── download-logos.js           # Download logos
│       ├── brands.json                 # Brand names only
│       ├── brands-with-logos.json      # Brands + logo URLs
│       └── seed-brands.ts              # Seed to DynamoDB
└── app/
    └── public/
        └── logos/
            ├── mercedes-benz.png
            ├── bmw.png
            ├── toyota.png
            └── ... (377 logos)
```

## DynamoDB Schema

```json
{
  "PK": "CONFIG#BRANDS",
  "SK": "CONFIG#BRANDS",
  "brands": [
    {
      "name": "Mercedes-Benz",
      "slug": "mercedes-benz",
      "logo": "/logos/mercedes-benz.png"
    }
  ],
  "updatedAt": 1234567890
}
```

## Update Logos

To refresh logos:
```bash
cd packages/api
node scripts/scrape-brands-clean.js > scripts/brands.json
npm run download-logos
AWS_PROFILE=basil TABLE_NAME=FuelSyncTable npm run seed-brands
```
