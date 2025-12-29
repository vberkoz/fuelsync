# FuelSync - Project Context

## Project Overview
FuelSync is a serverless vehicle expense tracking application built on AWS. Track fuel consumption, maintenance costs, and vehicle expenses with analytics and insights.

## Current Status: Phase 1 MVP (Months 1-3)

### Completed Infrastructure
- ✅ AWS CDK infrastructure setup
- ✅ S3 buckets for landing and app hosting
- ✅ CloudFront distributions with custom domains
- ✅ Route53 DNS configuration
- ✅ SSL certificates via ACM
- ✅ React web application scaffolding with TypeScript
- ✅ Astro landing page
- ✅ Basic routing and layout structure
- ✅ DynamoDB table with single-table design (PK, SK, GSI1, GSI2)
- ✅ Lambda functions for vehicles, refills, and expenses (list/create operations)
- ✅ API Gateway REST API with Lambda integrations
- ✅ Cognito user pool with email authentication

### Phase 1 MVP Requirements

#### Infrastructure Setup (In Progress)
- ✅ DynamoDB table design and creation
- ✅ Lambda function scaffolding
- ✅ API Gateway setup
- ✅ Cognito user pool configuration
- ✅ S3 bucket for user uploads (receipts/photos)

#### Core Features (To Implement)
- ✅ User authentication (email/password)
  - ✅ POST /auth/register - User registration with email verification
  - ✅ POST /auth/login - User login with JWT tokens
  - ✅ POST /auth/refresh - Token refresh
  - ✅ Login page with dark theme UI
  - ✅ Register page with dark theme UI
- ✅ Vehicle management (add, edit, delete)
  - ✅ GET /vehicles - List all vehicles
  - ✅ POST /vehicles - Create a vehicle
  - ✅ GET /vehicles/:id - Get single vehicle
  - ✅ PUT /vehicles/:id - Update vehicle
  - ✅ DELETE /vehicles/:id - Delete vehicle
  - ✅ Vehicle management UI with HeadlessUI dialogs (list, add, edit, delete)
  - ✅ Current vehicle selection with radio buttons
  - ✅ Current vehicle display in sidebar and mobile header
  - ✅ Overflow menu for vehicle actions
- ✅ Refill tracking (CRUD operations)
  - ✅ GET /vehicles/:id/refills - List all refills
  - ✅ POST /vehicles/:id/refills - Create a refill
  - ✅ GET /vehicles/:id/refills/:refillId - Get single refill
  - ✅ PUT /vehicles/:id/refills/:refillId - Update refill
  - ✅ DELETE /vehicles/:id/refills/:refillId - Delete refill
  - ✅ Refill management UI with HeadlessUI dialogs (list, add, edit, delete)
  - ✅ Current vehicle context with localStorage persistence
  - ✅ Overflow menu for refill actions
- [ ] Basic expense tracking
- [ ] Simple statistics (totals, averages)
- [ ] Basic charts (fuel consumption, costs)
- [ ] Responsive web application

#### Deliverables
- [ ] Functional web app
- [ ] API documentation
- [ ] Basic admin panel
- [ ] Landing page (partially complete)

## Technology Stack

### Authentication
- **Service**: Amazon Cognito
- **User Pool**: Email-based authentication
- **Sign-in**: Email + password with SRP protocol
- **Password Policy**: Min 8 chars, uppercase, lowercase, digits required
- **Token Validity**: Access/ID tokens 60 min, refresh tokens 30 days
- **Account Recovery**: Email-only password reset
- **User Attributes**: Email (required), given name, family name (optional)

### Frontend (Web App)
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI (Dialog, Menu, Listbox, RadioGroup), Heroicons
- **Routing**: React Router v6
- **State Management**: Zustand (auth, current vehicle), TanStack Query (server state)
- **API Client**: Centralized API utilities with fetch
- **Charts**: Chart.js

### Backend (AWS Serverless)
- **Compute**: AWS Lambda (Node.js 20.x)
- **API**: API Gateway (RESTful)
- **Database**: DynamoDB (single-table design)
- **Auth**: Amazon Cognito
- **Storage**: S3 for receipts and images
  - **Uploads Bucket**: Encrypted (S3-managed), CORS enabled, lifecycle rules
  - **Bucket Name**: fuelsync-uploads-{account-id}
  - **Access**: Private (block all public access)
  - **Lifecycle**: Transitions to Intelligent-Tiering after 30 days
- **CDN**: CloudFront
- **IaC**: AWS CDK with TypeScript

### Landing Page
- **Framework**: Astro
- **Styling**: Tailwind CSS

## Database Design (DynamoDB Single-Table)

### Implemented Table: FuelSyncTable

**Configuration**:
- Billing Mode: PAY_PER_REQUEST (on-demand)
- Point-in-Time Recovery: Enabled (pointInTimeRecoverySpecification)
- Removal Policy: DESTROY (for development)

**Primary Keys**:
- **PK** (Partition Key): STRING - Entity identifier
- **SK** (Sort Key): STRING - Entity type and metadata

**Global Secondary Indexes**:
- **GSI1**: Inverted index for alternate access patterns
  - GSI1PK (Partition Key): STRING
  - GSI1SK (Sort Key): STRING
  - Projection: ALL
  - Use cases: User queries, email lookup, get all user data

- **GSI2**: Date-based and category queries
  - GSI2PK (Partition Key): STRING
  - GSI2SK (Sort Key): STRING
  - Projection: ALL
  - Use cases: Monthly expenses, category filters, active reminders

### Table: FuelSyncTable

**Primary Keys**:
- PK (Partition Key): Entity identifier
- SK (Sort Key): Entity type and metadata
- GSI1PK/GSI1SK: Inverted index for alternate access patterns
- GSI2PK/GSI2SK: Date-based queries

### Access Patterns

```
1. User Profile
   PK: USER#{userId}
   SK: PROFILE
   Attributes: email, name, subscriptionTier, settings, currency

2. User Vehicles
   PK: USER#{userId}
   SK: VEHICLE#{vehicleId}
   Attributes: make, model, year, vin, licensePlate, fuelType, tankCapacity

3. Vehicle Refills
   PK: VEHICLE#{vehicleId}
   SK: REFILL#{timestamp}#{refillId}
   Attributes: odometer, volume, pricePerUnit, totalCost, currency, fuelType, station

4. Vehicle Expenses
   PK: VEHICLE#{vehicleId}
   SK: EXPENSE#{timestamp}#{expenseId}
   Attributes: category, amount, currency, odometer, description, taxDeductible

5. Vehicle Reminders
   PK: VEHICLE#{vehicleId}
   SK: REMINDER#{reminderId}
   Attributes: title, type, threshold, currentValue, recurring, status
```

## API Structure (Implemented)

**Base URL**: `https://<api-id>.execute-api.us-east-1.amazonaws.com/v1`

### Implemented Endpoints
```
Authentication:
POST   /auth/register         # Register new user (registerUser Lambda)
POST   /auth/login            # Login user (loginUser Lambda)
POST   /auth/refresh          # Refresh access token (refreshToken Lambda)

Vehicles:
GET    /vehicles              # List all vehicles (listVehicles Lambda)
POST   /vehicles              # Create a vehicle (createVehicle Lambda)
GET    /vehicles/:id          # Get single vehicle (getVehicle Lambda)
PUT    /vehicles/:id          # Update vehicle (updateVehicle Lambda)
DELETE /vehicles/:id          # Delete vehicle (deleteVehicle Lambda)

Refills:
GET    /vehicles/:id/refills  # List refills for a vehicle (listRefills Lambda)
POST   /vehicles/:id/refills  # Create a refill (createRefill Lambda)
GET    /vehicles/:id/refills/:refillId  # Get single refill (getRefill Lambda)
PUT    /vehicles/:id/refills/:refillId  # Update refill (updateRefill Lambda)
DELETE /vehicles/:id/refills/:refillId  # Delete refill (deleteRefill Lambda)

Expenses:
GET    /vehicles/:id/expenses # List expenses for a vehicle (listExpenses Lambda)
POST   /vehicles/:id/expenses # Create an expense (createExpense Lambda)
```

### API Gateway Configuration
- **API Name**: FuelSync API
- **Stage**: v1
- **CORS**: Enabled for all origins and methods
- **Integration**: Lambda proxy integration
- **Resources**: /vehicles, /vehicles/{id}/refills, /vehicles/{id}/expenses

### To Implement
```
Authentication:
POST   /auth/logout           # Logout user (revoke tokens)

Users:
GET    /users/me
PUT    /users/me

Expenses (additional):
GET    /vehicles/:id/expenses/:expenseId
PUT    /vehicles/:id/expenses/:expenseId
DELETE /vehicles/:id/expenses/:expenseId

Analytics:
GET    /vehicles/:id/analytics/summary
```

## Project Structure

```
fuelsync/
├── packages/
│   ├── api/                    # Lambda functions
│   │   ├── src/
│   │   │   ├── handlers/       # Lambda handler functions
│   │   │   │   ├── auth/       # Authentication operations
│   │   │   │   │   ├── register.ts
│   │   │   │   │   ├── login.ts
│   │   │   │   │   └── refresh.ts
│   │   │   │   ├── vehicles/   # Vehicle CRUD operations
│   │   │   │   │   ├── list.ts
│   │   │   │   │   ├── create.ts
│   │   │   │   │   ├── get.ts
│   │   │   │   │   ├── update.ts
│   │   │   │   │   └── delete.ts
│   │   │   │   ├── refills/    # Refill CRUD operations
│   │   │   │   │   ├── list.ts
│   │   │   │   │   ├── create.ts
│   │   │   │   │   ├── get.ts
│   │   │   │   │   ├── update.ts
│   │   │   │   │   └── delete.ts
│   │   │   │   └── expenses/   # Expense CRUD operations
│   │   │   │       ├── list.ts
│   │   │   │       └── create.ts
│   │   │   └── utils/          # Shared utilities
│   │   │       ├── dynamodb.ts # DynamoDB client
│   │   │       └── response.ts # API response helper
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── app/                    # React web application
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Page components
│   │   │   │   ├── Login.tsx   # Login page
│   │   │   │   ├── Register.tsx # Register page
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Vehicles.tsx
│   │   │   │   └── ...
│   │   │   ├── App.tsx         # Main app component
│   │   │   └── main.tsx        # Entry point
│   │   ├── .env.example        # Environment variables template
│   │   └── package.json
│   ├── infrastructure/         # AWS CDK infrastructure
│   │   ├── lib/
│   │   │   └── infrastructure-stack.ts
│   │   └── package.json
│   └── landing/                # Astro landing page
│       └── src/
├── devdocs/                    # Documentation
│   └── brainstorm.md          # Detailed architecture and planning
└── README.md
```

## Current Pages (Scaffolded)
- Login (/login) - Dark theme authentication ✅
- Register (/register) - Dark theme registration ✅
- Dashboard (/)
- Vehicles (/vehicles) - Full CRUD UI with current vehicle selection ✅
- Refills (/refills, /refills/:vehicleId) - Full CRUD UI with current vehicle context ✅
- Expenses (/expenses)
- Analytics (/analytics)
- Reminders (/reminders)

## UI Features
- ✅ Dark theme with gradient backgrounds
- ✅ Responsive mobile and desktop layouts
- ✅ Current vehicle selection with RadioGroup
- ✅ Current vehicle display in sidebar (desktop) and header (mobile)
- ✅ Overflow menus for item actions (vehicles, refills)
- ✅ HeadlessUI Dialog for forms
- ✅ HeadlessUI Menu for overflow actions
- ✅ HeadlessUI Listbox for dropdowns (fuel type selection)
- ✅ HeadlessUI RadioGroup for vehicle selection
- ✅ Custom radio button styling matching theme colors
- ✅ Loading states with spinners
- ✅ TanStack Query for data fetching and caching
- ✅ Optimistic UI updates for all mutations
- ✅ Automatic rollback on errors
- ✅ Zustand stores for auth and vehicle state management/refills)
- Expenses (/expenses)
- Analytics (/analytics)
- Reminders (/reminders)

## US Market Optimization
- Default units: Miles, Gallons, USD
- MPG as primary fuel efficiency metric
- IRS mileage rate tracking ($0.67/mile for 2024)
- US date format (MM/DD/YYYY)
- 12-hour time format with AM/PM
- US fuel grades: Regular 87, Mid-grade 89, Premium 91-93, Diesel

## Development Priorities

### Immediate Next Steps
1. ✅ **DynamoDB Setup**: Create table with GSIs
2. ✅ **Lambda Functions**: Auth, vehicles, refills, expenses CRUD
3. ✅ **API Gateway**: REST API with Lambda integrations
4. ✅ **Cognito Setup**: User pool and app client configuration
5. ✅ **Authentication**: Register, login, and token refresh endpoints
6. **Frontend Integration**: Connect React app to API
6. **Basic UI**: Implement vehicle and refill forms
7. **Simple Analytics**: Display totals and averages

### Phase 1 Success Criteria
- Users can register and login
- Users can add/edit/delete vehicles
- Users can log refills with automatic consumption calculations
- Users can track basic expenses
- Users can view simple statistics and charts
- Responsive design works on mobile and desktop

## Design Principles
- **Simplicity First**: Quick entry forms (3-tap refill entry)
- **Mobile-First**: Touch-friendly, thumb-zone optimized
- **Data Visualization**: Clear, colorful charts with trend indicators
- **Accessibility**: WCAG 2.1 AA compliance

## Security & Privacy
- JWT tokens with short expiration (15 minutes)
- Encryption at rest (DynamoDB, S3)
- Encryption in transit (TLS 1.3)
- Input validation and sanitization
- AWS IAM least privilege principle
- S3 uploads bucket: Private access, S3-managed encryption, CORS configured

## Cost Optimization
- Serverless architecture for auto-scaling
- On-demand DynamoDB pricing initially
- CloudFront caching strategy
- ARM64 Lambda functions for 20% savings
- S3 Intelligent-Tiering for user uploads

## Testing Strategy
- Unit tests: Jest + React Testing Library
- Integration tests: API endpoint testing
- E2E tests: Cypress or Playwright
- Target: >80% code coverage

## Deployment
- **Landing**: S3 + CloudFront (fuelsync.vberkoz.com)
- **App**: S3 + CloudFront (app.fuelsync.vberkoz.com)
- **API**: API Gateway + Lambda (deployed at /v1 stage)
- **Database**: DynamoDB FuelSyncTable (deployed)
- **CI/CD**: GitHub Actions (to be configured)

### Deploy Infrastructure
```bash
cd packages/infrastructure
npm install
npx cdk deploy --all --profile basil
```

### DynamoDB Table Details
- Table Name: FuelSyncTable
- Indexes: GSI1, GSI2
- Billing: On-demand (pay per request)
- Backup: Point-in-time recovery enabled

## Environment Variables (To Configure)
```
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=<to-be-created>
COGNITO_CLIENT_ID=<to-be-created>
API_GATEWAY_URL=<from-cdk-output-ApiUrl>
DYNAMODB_TABLE_NAME=FuelSyncTable
```

## API Gateway Details
- **API Name**: FuelSync API
- **Stage**: v1
- **Endpoint Type**: Regional
- **CORS**: Enabled (all origins, all methods)
- **Integration Type**: Lambda Proxy
- **Deployed Endpoints**:
  - POST /auth/register
  - POST /auth/login
  - POST /auth/refresh
  - GET /vehicles
  - POST /vehicles
  - GET /vehicles/{id}
  - PUT /vehicles/{id}
  - DELETE /vehicles/{id}
  - GET /vehicles/{id}/refills
  - POST /vehicles/{id}/refills
  - GET /vehicles/{id}/expenses
  - POST /vehicles/{id}/expenses

## Lambda Functions

### Implemented Handlers

**Vehicles**:
- `listVehicles`: GET /vehicles - List all vehicles for authenticated user
- `createVehicle`: POST /vehicles - Create new vehicle
- `getVehicle`: GET /vehicles/:id - Get single vehicle by ID
- `updateVehicle`: PUT /vehicles/:id - Update existing vehicle
- `deleteVehicle`: DELETE /vehicles/:id - Delete vehicle

**Refills**:
- `listRefills`: GET /vehicles/:vehicleId/refills - List refills for vehicle
- `createRefill`: POST /vehicles/:vehicleId/refills - Create new refill entry

**Expenses**:
- `listExpenses`: GET /vehicles/:vehicleId/expenses - List expenses for vehicle
- `createExpense`: POST /vehicles/:vehicleId/expenses - Create new expense entry

### Lambda Configuration
- Runtime: Node.js 20.x
- Environment: TABLE_NAME=FuelSyncTable
- Permissions: DynamoDB read/write access via IAM roles
- Handler pattern: TypeScript with AWS SDK v3

### Shared Utilities
- `utils/dynamodb.ts`: DynamoDB DocumentClient configuration
- `utils/response.ts`: Standardized API response formatting with CORS

## Key Metrics (Phase 1 Targets)
- Month 3: 500 users
- D1 retention: >40%
- Average 8+ refills per user per month
- Page load time: <2 seconds
- API response time: <200ms (p95)

## References
- Detailed architecture: `devdocs/brainstorm.md`
- Landing page: `packages/landing/`
- Web app: `packages/app/`
- Infrastructure: `packages/infrastructure/`
