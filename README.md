# fuelsync

A serverless vehicle expense tracking application built on AWS. Track fuel consumption, maintenance costs, and vehicle expenses with beautiful analytics and insights.

## Features

- **Fuel Tracking**: Log refills with automatic consumption calculations
- **Expense Management**: Track maintenance, repairs, and other vehicle costs
- **Analytics**: Visualize spending patterns and fuel efficiency trends
- **Multi-Vehicle Support**: Manage multiple vehicles in one account
- **Multi-Currency**: Track expenses in 150+ currencies with automatic conversion
- **Reminders**: Maintenance alerts based on mileage or time
- **Tax Reports**: Export IRS-compliant expense reports

## Architecture

**Serverless AWS Stack**:
- **Frontend**: React/Vue.js hosted on S3 + CloudFront
- **Auth**: Amazon Cognito
- **API**: API Gateway + Lambda (Node.js/Python)
- **Database**: DynamoDB (single-table design)
- **Storage**: S3 for receipts and images
- **Notifications**: SES + SNS
- **Scheduling**: EventBridge

## Database Design

Single-table DynamoDB design with GSIs for flexible querying:
- User profiles and vehicles
- Refills, expenses, and income tracking
- Maintenance reminders
- Currency exchange rates

See [brainstorm.md](fuelsync/brainstorm.md) for detailed architecture.
