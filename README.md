# fuelsync

A serverless vehicle expense tracking application built on AWS. Track fuel consumption, maintenance costs, and vehicle expenses with beautiful analytics and insights.

## ✅ Phase 1 MVP Complete

Full-featured PWA with complete CRUD operations, analytics, internationalization, and data migration capabilities.

## Features

- **PWA Support**: Installable app with offline support and native experience
- **Fuel Tracking**: Log refills with automatic consumption calculations and fuel type defaults
- **Expense Management**: Track maintenance, repairs, and other vehicle costs with 15 categories
- **Multi-Vehicle Support**: Manage multiple vehicles with dropdown selector and auto-selection
- **Data Migration**: Import existing data from SQLite databases with category mapping
- **Dark Theme UI**: Modern, responsive interface with HeadlessUI components
- **Real-time Updates**: Optimistic UI updates with automatic rollback
- **Infinite Scroll**: Load historical data by month with automatic pagination
- **Session Management**: Automatic redirect to login when token expires
- **Numeric Precision**: All monetary values with 2 decimal places and dot separator
- **Analytics & Charts**: Statistics cards and Chart.js visualizations
- **Internationalization**: English and Ukrainian language support
- **Responsive Design**: Mobile-first approach with touch-friendly interface

## Tech Stack

**Frontend**:
- React 18 + TypeScript + Vite
- PWA with offline support (vite-plugin-pwa)
- TailwindCSS + HeadlessUI + Heroicons
- TanStack Query (infinite queries) + Zustand (state)
- Chart.js + react-chartjs-2 (analytics)
- React Router v6 + i18next (internationalization)
- JetBrains Mono font for numbers

**Backend (AWS Serverless)**:
- API Gateway + Lambda (Node.js 20.x)
- DynamoDB (single-table design)
- Amazon Cognito (authentication)
- S3 + CloudFront (hosting)

## Getting Started

### Prerequisites
- Node.js 20+
- AWS CLI configured with credentials
- AWS CDK installed globally

### Deploy Infrastructure

```bash
cd packages/infrastructure
npm install
npx cdk deploy --all --profile <your-profile>
```

### Run Web App Locally

```bash
cd packages/app
npm install
cp .env.example .env
# Update .env with API Gateway URL and Cognito details
npm run dev
```

### Migrate Data from SQLite

If you have existing data in SQLite format:

```bash
cd packages/migration
npm install
# Update USER_ID in index.js
npm run migrate
```

## Project Structure

```
fuelsync/
├── packages/
│   ├── api/              # Lambda functions
│   ├── app/              # React web app
│   ├── infrastructure/   # AWS CDK
│   ├── landing/          # Astro landing page
│   └── migration/        # SQLite to DynamoDB migration
└── devdocs/              # Documentation
```

## Documentation

- [CONTEXT.md](CONTEXT.md) - Current project status and implementation details
- [devdocs/brainstorm.md](devdocs/brainstorm.md) - Detailed architecture and planning
