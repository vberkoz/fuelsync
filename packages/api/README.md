# FuelSync API

AWS Lambda functions for FuelSync serverless backend.

## ✅ Complete Implementation

- **Authentication**: Register, login, token refresh with Cognito
- **Vehicles**: Full CRUD with cascade delete and statistics
- **Refills**: CRUD with pagination and consumption tracking
- **Expenses**: CRUD with category mapping and monthly grouping
- **Users**: Profile and settings management
- **Dashboard**: Summary data aggregation
- **Analytics**: Statistics and chart data generation

## API Endpoints

### Authentication
- `POST /auth/register` - User registration with email verification
- `POST /auth/login` - User login with JWT tokens
- `POST /auth/refresh` - Refresh access token

### Vehicles
- `GET /vehicles` - List all user vehicles
- `POST /vehicles` - Create new vehicle
- `GET /vehicles/:id` - Get single vehicle
- `PUT /vehicles/:id` - Update vehicle
- `DELETE /vehicles/:id` - Delete vehicle (cascade delete refills/expenses)
- `GET /vehicles/:id/statistics` - Get vehicle statistics
- `GET /vehicles/:id/charts` - Get chart data (6 months)

### Refills
- `GET /vehicles/:id/refills` - List refills with pagination
- `POST /vehicles/:id/refills` - Create refill
- `GET /vehicles/:id/refills/:refillId` - Get single refill
- `PUT /vehicles/:id/refills/:refillId` - Update refill
- `DELETE /vehicles/:id/refills/:refillId` - Delete refill

### Expenses
- `GET /vehicles/:id/expenses` - List expenses with pagination
- `POST /vehicles/:id/expenses` - Create expense
- `GET /vehicles/:id/expenses/:expenseId` - Get single expense
- `PUT /vehicles/:id/expenses/:expenseId` - Update expense
- `DELETE /vehicles/:id/expenses/:expenseId` - Delete expense

### Users
- `GET /users/me` - Get user profile
- `PUT /users/me` - Update user profile
- `GET /users/settings` - Get user settings
- `PUT /users/settings` - Update user settings

### Dashboard
- `GET /dashboard` - Get dashboard summary

## Development

### Local Testing
```bash
cd packages/api
npm install
npm run build
npm run test
```

### Seed Test Data
```bash
AWS_PROFILE=your-profile USER_ID="your-user-id" npm run seed
```

## Tech Stack

- **Runtime**: Node.js 20.x
- **Language**: TypeScript
- **Database**: DynamoDB with AWS SDK v3
- **Authentication**: Amazon Cognito JWT validation
- **Architecture**: Single-table design with GSI indexes

## Project Structure

```
src/
├── handlers/
│   ├── auth/           # Authentication operations
│   ├── vehicles/       # Vehicle CRUD + analytics
│   ├── refills/        # Refill CRUD operations
│   ├── expenses/       # Expense CRUD operations
│   ├── users/          # User profile/settings
│   └── dashboard/      # Dashboard summary
└── utils/
    ├── dynamodb.ts     # DynamoDB client
    └── response.ts     # API response helpers
```

## Lambda Configuration

- **Memory**: 256 MB (default)
- **Timeout**: 30 seconds
- **Environment**: `TABLE_NAME=FuelSyncTable`
- **Permissions**: DynamoDB read/write via IAM roles
- **Architecture**: ARM64 for cost optimization

## Data Validation

All endpoints include:
- JWT token validation
- Input parameter validation
- Type checking with TypeScript
- Error handling with proper HTTP status codes
- CORS headers for web app integration