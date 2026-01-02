# FuelSync - Project Context

## Project Overview
FuelSync is a serverless vehicle expense tracking application built on AWS. Track fuel consumption, maintenance costs, and vehicle expenses with analytics and insights.

## Current Status: Phase 1 MVP Complete ✅

### Completed Infrastructure
- ✅ AWS CDK infrastructure setup
- ✅ S3 buckets for landing and app hosting
- ✅ CloudFront distributions with custom domains
- ✅ Route53 DNS configuration
- ✅ SSL certificates via ACM
- ✅ React web application with TypeScript and PWA support
- ✅ Astro landing page
- ✅ Complete routing and layout structure
- ✅ DynamoDB table with single-table design (PK, SK, GSI1, GSI2)
- ✅ Complete Lambda functions for all CRUD operations
- ✅ API Gateway REST API with full Lambda integrations
- ✅ Cognito user pool with email authentication

### Phase 1 MVP Requirements - COMPLETE ✅

#### Infrastructure Setup
- ✅ DynamoDB table design and creation
- ✅ Lambda function implementation (all handlers)
- ✅ API Gateway setup with CORS
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
  - ✅ DELETE /vehicles/:id - Delete vehicle with cascade delete (removes all refills and expenses)
  - ✅ Vehicle management UI with HeadlessUI dialogs (list, add, edit, delete)
  - ✅ Current vehicle selection with radio buttons
  - ✅ Current vehicle display in sidebar and mobile header with dropdown selector
  - ✅ Auto-select first vehicle if none selected
  - ✅ Overflow menu for vehicle actions
- ✅ Refill tracking (CRUD operations)
  - ✅ GET /vehicles/:id/refills - List all refills
  - ✅ POST /vehicles/:id/refills - Create a refill
  - ✅ GET /vehicles/:id/refills/:refillId - Get single refill
  - ✅ PUT /vehicles/:id/refills/:refillId - Update refill
  - ✅ DELETE /vehicles/:id/refills/:refillId - Delete refill (queries by refillId attribute)
  - ✅ Refill management UI with HeadlessUI dialogs (list, add, edit, delete)
  - ✅ Current vehicle context with localStorage persistence
  - ✅ Timestamp-based date display from migrated data
  - ✅ Overflow menu for refill actions
- ✅ Basic expense tracking
  - ✅ GET /vehicles/:id/expenses - List all expenses
  - ✅ POST /vehicles/:id/expenses - Create an expense
  - ✅ GET /vehicles/:id/expenses/:expenseId - Get single expense
  - ✅ PUT /vehicles/:id/expenses/:expenseId - Update expense
  - ✅ DELETE /vehicles/:id/expenses/:expenseId - Delete expense (queries by expenseId attribute)
  - ✅ Expense management UI with HeadlessUI dialogs (list, add, edit, delete)
  - ✅ Category selection with Listbox (Maintenance, Repair, Insurance, etc.)
  - ✅ Timestamp-based date display from migrated data
  - ✅ Overflow menu for expense actions
- ✅ Simple statistics (totals, averages)
  - ✅ GET /vehicles/:id/statistics - Get statistics for a vehicle
  - ✅ Statistics Lambda handler with refills and expenses aggregation
  - ✅ Analytics page with statistics cards
  - ✅ Fuel statistics: count, total volume, total cost, avg price/unit, avg refill cost
  - ✅ Expense statistics: count, total cost, avg expense cost
  - ✅ Total costs across all categories
  - ✅ HeadlessUI icons (FireIcon, ChartBarIcon, CurrencyDollarIcon)
- ✅ Basic charts (fuel consumption, costs)
  - ✅ Chart.js and react-chartjs-2 installed
  - ✅ GET /vehicles/:id/charts - Get chart data for a vehicle
  - ✅ Charts Lambda handler with monthly aggregation (6 months)
  - ✅ LineChart component wrapper with dark theme
  - ✅ Fuel consumption chart (volume over time)
  - ✅ Costs chart (fuel and expenses over time)
- ✅ Responsive web application
  - ✅ Mobile-first responsive padding (p-4 sm:p-6 lg:p-8)
  - ✅ Responsive typography (text-2xl sm:text-3xl for headings)
  - ✅ Responsive button sizes (px-3 py-2 sm:px-4)
  - ✅ Responsive grid layouts (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)
  - ✅ Responsive card spacing (gap-4 sm:gap-6)
  - ✅ Responsive icon sizes (h-6 w-6 sm:h-8 sm:w-8)
  - ✅ Responsive chart heights (h-48 sm:h-64)
  - ✅ Mobile sidebar with backdrop and slide-in animation
  - ✅ Desktop/mobile table/card views for data lists
  - ✅ Touch-friendly mobile interface

#### Deliverables - COMPLETE ✅
- ✅ Functional web app with full CRUD operations
- ✅ Complete API with all endpoints implemented
- ✅ PWA with offline support and installable experience
- ✅ Landing page (Astro-based)
- ✅ Data migration tool for SQLite to DynamoDB
- ✅ Internationalization (English/Ukrainian)
- ✅ Responsive mobile-first design
- ✅ Analytics with charts and statistics

## Technology Stack

### Authentication
- **Service**: Amazon Cognito
- **User Pool**: Email-based authentication
- **Sign-in**: Email + password with SRP protocol
- **Password Policy**: Min 8 chars, uppercase, lowercase, digits required
- **Token Validity**: Access/ID tokens 15 min, refresh tokens 7 days
- **Account Recovery**: Email-only password reset
- **User Attributes**: Email (required), given name, family name (optional)

### Frontend (Web App)
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **PWA**: vite-plugin-pwa with Workbox (offline support, installable)
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI (Dialog, Menu, Listbox), Heroicons
- **Routing**: React Router v6
- **State Management**: Zustand (auth, current vehicle), TanStack Query (server state)
- **API Client**: Centralized API utilities with fetch
- **Tables**: TanStack Table (responsive tables/cards)
- **Charts**: Chart.js with react-chartjs-2

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
   Attributes: odometer, volume, pricePerUnit, totalCost, currency, exchangeRate, baseAmount, fuelType, station

4. Vehicle Expenses
   PK: VEHICLE#{vehicleId}
   SK: EXPENSE#{timestamp}#{expenseId}
   Attributes: category, amount, currency, exchangeRate, baseAmount, odometer, description

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
GET    /vehicles/:id/statistics # Get statistics for a vehicle (getStatistics Lambda)
GET    /vehicles/:id/charts     # Get chart data for a vehicle (getCharts Lambda)

Users:
GET    /users/me              # Get user profile (getProfile Lambda)
PUT    /users/me              # Update user profile (updateProfile Lambda)
GET    /users/settings        # Get user settings (getSettings Lambda)
PUT    /users/settings        # Update user settings (updateSettings Lambda)

Dashboard:
GET    /dashboard             # Get dashboard summary (getDashboard Lambda)

Refills:
GET    /vehicles/:id/refills  # List refills for a vehicle (listRefills Lambda)
POST   /vehicles/:id/refills  # Create a refill (createRefill Lambda)
GET    /vehicles/:id/refills/:refillId  # Get single refill (getRefill Lambda)
PUT    /vehicles/:id/refills/:refillId  # Update refill (updateRefill Lambda)
DELETE /vehicles/:id/refills/:refillId  # Delete refill (deleteRefill Lambda)

Expenses:
GET    /vehicles/:id/expenses # List expenses for a vehicle (listExpenses Lambda)
POST   /vehicles/:id/expenses # Create an expense (createExpense Lambda)
GET    /vehicles/:id/expenses/:expenseId  # Get single expense (getExpense Lambda)
PUT    /vehicles/:id/expenses/:expenseId  # Update expense (updateExpense Lambda)
DELETE /vehicles/:id/expenses/:expenseId  # Delete expense (deleteExpense Lambda)
```

### API Gateway Configuration
- **API Name**: FuelSync API
- **Stage**: v1
- **CORS**: Enabled for all origins and methods
- **Integration**: Lambda proxy integration
- **Resources**: /vehicles, /vehicles/{id}/refills, /vehicles/{id}/expenses

### Future Enhancements (Phase 2)
```
Authentication:
POST   /auth/logout           # Logout user (revoke tokens)

Reminders:
GET    /vehicles/:id/reminders    # List reminders for a vehicle
POST   /vehicles/:id/reminders    # Create a reminder
PUT    /vehicles/:id/reminders/:id # Update reminder
DELETE /vehicles/:id/reminders/:id # Delete reminder

Uploads:
POST   /uploads               # Upload receipt/photo to S3
GET    /uploads/:key          # Get signed URL for uploaded file
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
│   │   │   │   │   ├── delete.ts
│   │   │   │   │   ├── statistics.ts
│   │   │   │   │   └── charts.ts
│   │   │   │   ├── refills/    # Refill CRUD operations
│   │   │   │   │   ├── list.ts
│   │   │   │   │   ├── create.ts
│   │   │   │   │   ├── get.ts
│   │   │   │   │   ├── update.ts
│   │   │   │   │   └── delete.ts
│   │   │   │   ├── expenses/   # Expense CRUD operations
│   │   │   │   │   ├── list.ts
│   │   │   │   │   ├── create.ts
│   │   │   │   │   ├── get.ts
│   │   │   │   │   ├── update.ts
│   │   │   │   │   └── delete.ts
│   │   │   │   └── users/      # User profile operations
│   │   │   │       ├── get-profile.ts
│   │   │   │       ├── update-profile.ts
│   │   │   │       ├── get-settings.ts
│   │   │   │       └── update-settings.ts
│   │   │   └── dashboard/  # Dashboard operations
│   │   │       └── get.ts
│   │   │   └── utils/          # Shared utilities
│   │   │       ├── dynamodb.ts # DynamoDB client
│   │   │       └── response.ts # API response helper
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── app/                    # React web application
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── LineChart.tsx
│   │   │   │   └── ...
│   │   │   ├── pages/          # Page components
│   │   │   │   ├── Login.tsx   # Login page
│   │   │   │   ├── Register.tsx # Register page
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Vehicles.tsx
│   │   │   │   ├── Refills.tsx
│   │   │   │   ├── Expenses.tsx
│   │   │   │   ├── Analytics.tsx
│   │   │   │   ├── Reminders.tsx
│   │   │   │   ├── Profile.tsx
│   │   │   │   ├── Settings.tsx
│   │   │   │   └── ...
│   │   │   ├── App.tsx         # Main app component
│   │   │   └── main.tsx        # Entry point
│   │   ├── .env.example        # Environment variables template
│   │   └── package.json
│   ├── infrastructure/         # AWS CDK infrastructure
│   │   ├── lib/
│   │   │   └── infrastructure-stack.ts
│   │   └── package.json
│   ├── landing/                # Astro landing page
│   │   └── src/
│   └── migration/              # SQLite to DynamoDB migration tool
│       ├── index.js            # Migration script (extracts vehicle creation date from earliest refill/expense)
│       ├── cleanup.js          # Cleanup script
│       └── package.json
├── devdocs/                    # Documentation
│   └── brainstorm.md          # Detailed architecture and planning
└── README.md
```

## Current Pages (Scaffolded)
- Login (/login) - Dark theme authentication ✅
- Register (/register) - Dark theme registration ✅
- Dashboard (/) - Summary cards and recent activity ✅
- Vehicles (/vehicles) - Full CRUD UI with current vehicle selection ✅
- Refills (/refills, /refills/:vehicleId) - Full CRUD UI with current vehicle context ✅
- Expenses (/expenses, /expenses/:vehicleId) - Full CRUD UI with current vehicle context ✅
- Analytics (/analytics) - Statistics cards and charts (fuel consumption, costs) ✅
- Reminders (/reminders) - UI mock with reminder cards and form ✅
- Profile (/profile) - User profile management (name, currency) ✅
- Settings (/settings) - User settings (units, date format, notifications) ✅

## Internationalization (i18n)

### Implementation Status
- ✅ **Packages Installed**: react-i18next, i18next
- ✅ **Translation Files**: English and Ukrainian locales created
- ✅ **i18n Configuration**: Language detection with localStorage persistence
- ✅ **Language Switcher**: Added to Settings page with HeadlessUI Listbox
- ✅ **Initialization**: i18n imported in main.tsx before app render
- ✅ **Translation Coverage**: All pages and components translated
- ✅ **DynamoDB Integration**: Language preference saved to user settings

### Implemented Files
```
packages/app/src/
├── i18n.ts                           # i18n configuration
├── locales/
│   ├── en/translation.json           # English translations
│   └── uk/translation.json           # Ukrainian translations
└── main.tsx                          # i18n initialization
```

### Translated Pages
- ✅ Layout (navigation, sidebar)
- ✅ Dashboard
- ✅ Vehicles
- ✅ Refills (with localized month captions)
- ✅ Expenses (with localized month captions)
- ✅ Analytics
- ✅ Reminders
- ✅ Profile
- ✅ Settings

### Translation Keys Structure
- `common`: save, cancel, delete, edit, add, loading, saving, deleting, search, filter, close
- `navigation`: dashboard, vehicles, refills, expenses, analytics, reminders, profile, settings, logout
- `auth`: login, register, email, password, etc.
- `dashboard`: title, addVehicle, addRefill, addExpense, viewAnalytics, etc.
- `vehicles`: title, add, edit, delete, make, model, year, licensePlate, fuelType, etc.
- `refills`: title, add, edit, delete, odometer, volume, pricePerUnit, totalCost, station, date, etc.
- `expenses`: title, add, edit, delete, category, amount, description, etc.
- `analytics`: title, fuel, expenses, total, totalCost, allCosts, fuelConsumption, costs, etc.
- `reminders`: title, add, reminderTitle, type, threshold, unit, current, urgent
- `profile`: title, email, name, currency, saveChanges, loading
- `settings`: title, language, units, dateFormat, notifications, loading

### Implementation Steps
1. ✅ **Install i18n Library**
   - Added `react-i18next` and `i18next` packages
   - Configured i18next with language detection and localStorage persistence

2. ✅ **Translation Files Structure**
   ```
   packages/app/src/locales/
   ├── en/
   │   └── translation.json    # English translations
   └── uk/
       └── translation.json    # Ukrainian translations
   ```

3. ✅ **Translation Keys Organization**
   - `common`: Shared UI elements (buttons, labels, messages)
   - `auth`: Login, register, password reset
   - `navigation`: Sidebar menu items
   - `vehicles`: Vehicle management page
   - `refills`: Refills tracking page
   - `expenses`: Expenses tracking page
   - `analytics`: Statistics and charts
   - `reminders`: Reminders page
   - `profile`: User profile page
   - `settings`: Settings page
   - `dashboard`: Dashboard page

4. ✅ **Language Switcher Component**
   - Added language selector in Settings page
   - Uses HeadlessUI Listbox for language selection
   - Options: English (en), Українська (uk)
   - Stores preference in localStorage
   - Changes language immediately on selection

5. ✅ **User Settings Integration**
   - Added `language` field to user settings in DynamoDB
   - Updated settings API to persist language preference
   - Language saved automatically when changed

6. ✅ **Translation Coverage**
   - All UI text, labels, and buttons
   - Form validation messages
   - Error messages and notifications
   - Date and number formatting (locale-aware)
   - Chart labels and tooltips
   - Email templates (future)

7. **Implementation Priority**
   - Phase 1: Core UI (navigation, forms, buttons)
   - Phase 2: Messages and notifications
   - Phase 3: Dynamic content and charts

### Technical Details
- **Default Language**: English (en)
- **Fallback**: English for missing translations
- **Detection Order**: User settings → localStorage → browser language → default
- **Format**: JSON translation files with nested keys
- **Date Formatting**: Use `date-fns` with locale support
- **Number Formatting**: Use `Intl.NumberFormat` for currency and decimals

## Progressive Web App (PWA)
- ✅ **PWA Configuration**: vite-plugin-pwa with auto-update
- ✅ **Web App Manifest**: Installable app with icons and theme colors
- ✅ **Service Worker**: Workbox for offline caching and API responses
- ✅ **App Icons**: 192x192 and 512x512 PNG icons
- ✅ **Offline Support**: Cached assets and NetworkFirst API strategy
- ✅ **Install Prompt**: Native install experience on mobile and desktop
- ✅ **Theme Colors**: Dark theme (#1f2937) with emerald accent

### PWA Features
- **Display Mode**: Standalone (full-screen app experience)
- **Caching Strategy**: NetworkFirst for API calls (5-minute cache)
- **Asset Caching**: All JS, CSS, HTML, fonts, and images
- **Auto-Update**: Service worker updates automatically
- **Offline Fallback**: Cached data available when offline

## UI Features
- ✅ Dark theme with gradient backgrounds
- ✅ Responsive mobile and desktop layouts with mobile-first approach
- ✅ Responsive padding, typography, and spacing across all pages
- ✅ Responsive grid layouts and card designs
- ✅ Touch-friendly mobile interface with appropriate button sizes
- ✅ Heroicons in page headers matching sidebar navigation
- ✅ Icon buttons with PlusIcon/XMarkIcon for add/cancel actions
- ✅ Current vehicle selection with RadioGroup
- ✅ Current vehicle display in sidebar (desktop) with Listbox dropdown
- ✅ Auto-select first vehicle if none selected or selected vehicle doesn't exist
- ✅ Overflow menus for item actions (vehicles, refills, expenses)
- ✅ HeadlessUI Dialog for forms
- ✅ HeadlessUI Menu for overflow actions
- ✅ HeadlessUI Listbox for dropdowns (fuel type, vehicle selection)
- ✅ HeadlessUI RadioGroup for vehicle selection
- ✅ HeadlessUI Field and Label components for form inputs
- ✅ Custom radio button styling matching theme colors
- ✅ Loading states with spinners
- ✅ TanStack Query for data fetching and caching
- ✅ Infinite scroll with DynamoDB pagination for refills and expenses
- ✅ Monthly grouping for refills and expenses (displays 12 months initially)
- ✅ Query invalidation on successful mutations (no optimistic updates)
- ✅ Loading states for all mutations (Saving..., Deleting...)
- ✅ Disabled buttons during mutations to prevent duplicate requests
- ✅ Automatic redirect to login on 401 (token expired)
- ✅ Automatic redirect on CORS-blocked 401 responses (Failed to fetch)
- ✅ Token expiration: 15 minutes (access/ID), 7 days (refresh)
- ✅ Zustand stores for auth and vehicle state management
- ✅ JetBrains Mono font for all numbers and dates
- ✅ Right-aligned numeric columns in tables
- ✅ Two-line column headers with units on second row
- ✅ Currency displayed in column headers, not with values
- ✅ Floating point input with comma-to-dot conversion
- ✅ Two decimal precision for all monetary and volume values
- ✅ Textarea fields for station (refills) and description (expenses)
- ✅ Uppercase license plate input and display
- ✅ Chart.js with react-chartjs-2 for data visualization
- ✅ Line charts with legend for fuel consumption and costs

## Profile Management
- ✅ User profile page with HeadlessUI components
- ✅ Display user email (read-only from Cognito)
- ✅ Edit user name and currency preference
- ✅ Profile API endpoints (GET /users/me, PUT /users/me)
- ✅ Profile Lambda handlers with DynamoDB integration
- ✅ Optimistic UI updates for profile changes
- ✅ Profile link in sidebar menu

## Settings Management
- ✅ User settings page with HeadlessUI components
- ✅ Units preference (Imperial/Metric) with Listbox
- ✅ Date format preference with Listbox
- ✅ Notifications toggle with Switch
- ✅ Settings API endpoints (GET /users/settings, PUT /users/settings)
- ✅ Settings Lambda handlers with DynamoDB integration
- ✅ Auto-create default settings on first access
- ✅ Optimistic UI updates for settings changes
- ✅ Settings link in sidebar menu

## Dashboard
- ✅ Dashboard page with summary cards
- ✅ Vehicle count card with link to vehicles page
- ✅ Recent refills card (last 5) with link to refills page
- ✅ Recent expenses card (last 5) with link to expenses page
- ✅ Dashboard API endpoint (GET /dashboard)
- ✅ Dashboard Lambda handler with DynamoDB queries
- ✅ Responsive grid layout for cards
- ✅ Heroicons for card icons

## Reminders (UI Mock)
- ✅ Reminders page with mock data
- ✅ Reminder cards with progress bars
- ✅ Urgent status indicator (80%+ threshold)
- ✅ Add reminder form with HeadlessUI Dialog
- ✅ Type selection with Listbox (Maintenance, Document, Inspection)
- ✅ Unit selection with Listbox (km, days, months)
- ✅ Responsive grid layout for cards
- ✅ Visual progress indicators with color coding

## Recent Changes

### Profile Page Fix (Latest)
- **Issue**: Profile update endpoint (PUT /users/me) was returning 500 error
- **Cause**: Handler was trying to update `currency` field that was removed from Profile page
- **Fix**: Updated `update-profile.ts` handler to only update `name` field
- **Files Modified**: `packages/api/src/handlers/users/update-profile.ts`
- **Status**: Fixed - Profile page now successfully updates user name

## US Market Optimization
- Default units: Miles, Gallons, USD
- MPG as primary fuel efficiency metric
- IRS mileage rate tracking ($0.67/mile for 2024)
- US date format (MM/DD/YYYY)
- 12-hour time format with AM/PM
- US fuel grades: Regular 87, Mid-grade 89, Premium 91-93, Diesel

## Development Priorities

### Phase 1 Complete ✅
1. ✅ **DynamoDB Setup**: Create table with GSIs
2. ✅ **Lambda Functions**: Auth, vehicles, refills, expenses CRUD
3. ✅ **API Gateway**: REST API with Lambda integrations
4. ✅ **Cognito Setup**: User pool and app client configuration
5. ✅ **Authentication**: Register, login, and token refresh endpoints
6. ✅ **Frontend Integration**: Complete React app with API integration
7. ✅ **Full UI**: All CRUD forms and responsive design
8. ✅ **Analytics**: Statistics and charts implementation
9. ✅ **Internationalization (i18n)**: English/Ukrainian language switching
10. ✅ **PWA**: Offline support and installable app
11. ✅ **Data Migration**: SQLite to DynamoDB migration tool

### Phase 1 Success Criteria - ALL MET ✅
- ✅ Users can register and login
- ✅ Users can add/edit/delete vehicles
- ✅ Users can log refills with consumption tracking
- ✅ Users can track expenses with categories
- ✅ Users can view statistics and charts
- ✅ Responsive design works on mobile and desktop
- ✅ PWA installable with offline support
- ✅ Multi-language support (EN/UK)
- ✅ Data migration from existing SQLite databases

### Phase 2: Multi-Currency Support - IN PROGRESS 🚧

#### Overview
Implement multi-currency support with USD as base currency. All refills and expenses will store both the original currency amount and USD equivalent using real-time exchange rates.

#### Implementation Steps
1. ✅ **Backend: Exchange Rate Service**
   - ✅ Created exchange rate utility using free API (open.er-api.com)
   - ✅ Fetch and cache exchange rates (24-hour TTL in DynamoDB)
   - ✅ Fallback to cached rates if API unavailable
   - ✅ File: `packages/api/src/utils/exchange-rate.ts`

2. ✅ **Backend: Update Data Models**
   - ✅ Added TypeScript types for Refill and Expense with currency fields
   - ✅ Fields added: `currency`, `exchangeRate`, `baseAmount`
   - ✅ Updated DynamoDB schema documentation in CONTEXT.md
   - ✅ File: `packages/api/src/utils/types.ts`

3. ✅ **Backend: Update Create Handlers**
   - ✅ Modified createRefill: Fetch exchange rate, calculate baseAmount
   - ✅ Modified createExpense: Fetch exchange rate, calculate baseAmount
   - ✅ Both handlers now call getExchangeRate() utility
   - ✅ baseAmount = originalAmount / exchangeRate

4. ✅ **Backend: Update Other Handlers**
   - ✅ Modified updateRefill: Recalculate baseAmount on updates
   - ✅ Modified updateExpense: Recalculate baseAmount on updates
   - ✅ Updated statistics handler: Use baseAmount with fallback to original
   - ✅ Updated charts handler: Use baseAmount with fallback to original

5. ✅ **Backend: User Settings**
   - ✅ Added `preferredCurrency` field to user settings
   - ✅ Default to USD for new users
   - ✅ Updated get-settings handler with default value
   - ✅ Updated update-settings handler to accept preferredCurrency

6. ✅ **Frontend: Currency Utilities**
   - ✅ Created currency utility with list of 8 currencies
   - ✅ Added currency symbols mapping
   - ✅ Added formatCurrency() helper function
   - ✅ Added formatWithBaseAmount() for dual currency display
   - ✅ File: `packages/app/src/lib/currency.ts`

7. ✅ **Frontend: Update Forms**
   - ✅ Added currency selector to refill form (Listbox)
   - ✅ Added currency selector to expense form (Listbox)
   - ✅ Default to USD for new entries
   - ✅ Shows currency code and name in dropdown

8. ✅ **Frontend: Update Display Components**
   - ✅ Updated Refills page to show currency with USD equivalent
   - ✅ Updated Expenses page to show currency with USD equivalent
   - ✅ Uses formatWithBaseAmount() utility function
   - ✅ Format: "€45.23 ($50.00)" or "$50.00" (no duplicate for USD)
   - ✅ Applied to both desktop tables and mobile cards

9. ✅ **Frontend: Settings Page**
   - ✅ Added preferred currency selector with Listbox
   - ✅ Shows currency symbol, code, and name
   - ✅ Saves preference to user settings
   - ✅ Positioned between language and units fields

#### Multi-Currency Implementation Summary

**Completed Steps (1-9)** ✅:
- ✅ Backend exchange rate service with caching
- ✅ Database schema updated with currency fields
- ✅ All Lambda handlers support multi-currency
- ✅ Statistics and charts use USD for consistency
- ✅ User settings include preferredCurrency
- ✅ Frontend currency utilities and formatting
- ✅ Forms have currency selectors
- ✅ Display shows both original and USD amounts
- ✅ Settings page has currency preference selector

**How It Works**:
1. User selects currency when creating refill/expense
2. Backend fetches exchange rate from API (cached 24h)
3. Calculates baseAmount (USD equivalent)
4. Stores: amount, currency, exchangeRate, baseAmount
5. Frontend displays: "€45.23 ($50.00)" or "$50.00"
6. Statistics/charts aggregate using baseAmount (USD)
7. User can set preferred currency in Settings

**Phase 2 Multi-Currency Support - COMPLETE** ✅

#### Technical Details
- **Base Currency**: USD (all calculations and aggregations)
- **Exchange Rate API**: exchangerate-api.com (free tier: 1,500 requests/month)
- **Rate Caching**: Store rates in DynamoDB with daily TTL
- **Fallback**: Use last known rate if API unavailable
- **Supported Currencies**: USD, EUR, GBP, UAH, CAD, AUD, JPY, CNY
- **Display Format**: "$50.00 (€45.23)" or "€45.23 ($50.00 USD)"

#### Database Schema Updates
```
Refill:
  - currency: STRING (e.g., "USD", "EUR")
  - exchangeRate: NUMBER (e.g., 1.0 for USD, 0.92 for EUR)
  - baseAmount: NUMBER (totalCost in USD)
  - totalCost: NUMBER (original currency amount)

Expense:
  - currency: STRING
  - exchangeRate: NUMBER
  - baseAmount: NUMBER (amount in USD)
  - amount: NUMBER (original currency amount)

ExchangeRate (new entity):
  PK: EXCHANGE_RATE#{date}
  SK: CURRENCY#{code}
  rate: NUMBER
  lastUpdated: NUMBER (timestamp)
  ttl: NUMBER (24 hours)
```

#### API Changes
- No new endpoints required
- Existing endpoints return additional currency fields
- Statistics/charts use baseAmount for calculations

#### Migration Strategy
- Existing records without currency: Default to USD (rate: 1.0, baseAmount = totalCost/amount)
- Add migration script to backfill currency fields
- Frontend handles missing currency gracefully

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

### Seed Test Data
```bash
cd packages/api
npm install
AWS_PROFILE=basil USER_ID="your-user-id" npm run seed
```

Seeds DynamoDB with:
- 2 vehicles (Toyota Camry 2020, Honda Civic 2019)
- 6 refills (3 per vehicle)
- 6 expenses (3 per vehicle)
- 14 sequential operations with 200ms delays
- Uses UUID for IDs and timestamp field for dates

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
- `deleteVehicle`: DELETE /vehicles/:id - Delete vehicle with cascade delete (queries and batch deletes all related refills and expenses)

**Refills**:
- `listRefills`: GET /vehicles/:vehicleId/refills - List refills for vehicle with pagination (limit: 50, returns nextToken)
- `createRefill`: POST /vehicles/:vehicleId/refills - Create new refill entry
- `getRefill`: GET /vehicles/:vehicleId/refills/:refillId - Get single refill by ID
- `updateRefill`: PUT /vehicles/:vehicleId/refills/:refillId - Update existing refill
- `deleteRefill`: DELETE /vehicles/:vehicleId/refills/:refillId - Delete refill (queries all refills, filters by refillId attribute)

**Expenses**:
- `listExpenses`: GET /vehicles/:vehicleId/expenses - List expenses for vehicle with pagination (limit: 50, returns nextToken)
- `createExpense`: POST /vehicles/:vehicleId/expenses - Create new expense entry
- `getExpense`: GET /vehicles/:vehicleId/expenses/:expenseId - Get single expense by ID
- `updateExpense`: PUT /vehicles/:vehicleId/expenses/:expenseId - Update existing expense
- `deleteExpense`: DELETE /vehicles/:vehicleId/expenses/:expenseId - Delete expense (queries all expenses, filters by expenseId attribute)

**Statistics**:
- `getStatistics`: GET /vehicles/:vehicleId/statistics - Get aggregated statistics for a vehicle (refills and expenses totals and averages)

**Charts**:
- `getCharts`: GET /vehicles/:vehicleId/charts - Get chart data for a vehicle (monthly fuel consumption and costs for last 6 months)

**Users**:
- `getProfile`: GET /users/me - Get user profile
- `updateProfile`: PUT /users/me - Update user profile (name, currency)
- `getSettings`: GET /users/settings - Get user settings
- `updateSettings`: PUT /users/settings - Update user settings (units, dateFormat, notifications)

**Dashboard**:
- `getDashboard`: GET /dashboard - Get dashboard summary (vehicle count, recent refills, recent expenses)

### Lambda Configuration
- Runtime: Node.js 20.x
- Environment: TABLE_NAME=FuelSyncTable
- Permissions: DynamoDB read/write access via IAM roles
  - Delete handlers require ReadWriteData permissions for Query + Delete operations
  - Vehicle delete requires ReadWriteData for cascade delete (Query + BatchWrite)
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
