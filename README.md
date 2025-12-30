# fuelsync

A serverless vehicle expense tracking application built on AWS. Track fuel consumption, maintenance costs, and vehicle expenses with beautiful analytics and insights.

## Features

- **Fuel Tracking**: Log refills with automatic consumption calculations
- **Expense Management**: Track maintenance, repairs, and other vehicle costs
- **Multi-Vehicle Support**: Manage multiple vehicles with dropdown selector
- **Data Migration**: Import existing data from SQLite databases
- **Dark Theme UI**: Modern, responsive interface with HeadlessUI components
- **Real-time Updates**: Optimistic UI updates with automatic rollback

## Tech Stack

**Frontend**:
- React 18 + TypeScript + Vite
- TailwindCSS + HeadlessUI
- TanStack Query + TanStack Table
- Zustand for state management

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
