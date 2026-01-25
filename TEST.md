# FuelSync - Comprehensive QA Testing Guide

**Version**: 1.0  
**Last Updated**: Pre-Publication Testing  
**Target**: Production Release Readiness

---

## Table of Contents

1. [Authentication & Authorization Testing](#1-authentication--authorization-testing)
2. [Vehicle Management Testing](#2-vehicle-management-testing)
3. [Refill Tracking Testing](#3-refill-tracking-testing)
4. [Expense Management Testing](#4-expense-management-testing)
5. [Reminder System Testing](#5-reminder-system-testing)
6. [Analytics & Charts Testing](#6-analytics--charts-testing)
7. [Data Operations Testing](#7-data-operations-testing)
8. [User Profile Testing](#8-user-profile-testing)
9. [Cross-Browser Testing](#9-cross-browser-testing)
10. [Responsive Design Testing](#10-responsive-design-testing)
11. [PWA Testing](#11-pwa-testing)
12. [Internationalization Testing](#12-internationalization-testing)
13. [Performance Testing](#13-performance-testing)
14. [Security Testing](#14-security-testing)
15. [Data Integrity Testing](#15-data-integrity-testing)
16. [Error Handling Testing](#16-error-handling-testing)
17. [Accessibility Testing](#17-accessibility-testing)
18. [Edge Cases Testing](#18-edge-cases-testing)
19. [Integration Testing](#19-integration-testing)
20. [Load Testing](#20-load-testing)
21. [Pre-Launch Checklist](#21-pre-launch-checklist)
22. [Post-Deployment Smoke Tests](#22-post-deployment-smoke-tests)

---

## 1. Authentication & Authorization Testing

### 1.1 Sign Up Flow

#### Test Case 1.1.1: Valid Sign Up
- **Steps**:
  1. Navigate to sign up page
  2. Enter valid email (e.g., `test@example.com`)
  3. Enter firstName (e.g., `John`)
  4. Enter lastName (e.g., `Doe`)
  5. Enter password (min 8 chars, uppercase, lowercase, number, special char)
  6. Confirm password (must match)
  7. Click "Sign Up" button
- **Expected**: Account created, verification email sent, redirect to login
- **Verify**: User appears in Cognito User Pool

#### Test Case 1.1.2: Invalid Email Formats
- **Test with**:
  - `invalid-email` (no @)
  - `test@` (no domain)
  - `@example.com` (no username)
  - `test @example.com` (space)
  - `test@.com` (invalid domain)
- **Expected**: Inline validation error, form not submitted

#### Test Case 1.1.3: Weak Passwords
- **Test with**:
  - `short` (< 8 chars)
  - `alllowercase` (no uppercase)
  - `ALLUPPERCASE` (no lowercase)
  - `NoNumbers!` (no digits)
  - `NoSpecial123` (no special chars)
- **Expected**: Password requirements shown, form not submitted

#### Test Case 1.1.4: Password Mismatch
- **Steps**:
  1. Enter password: `Test123!@#`
  2. Enter confirm: `Test123!@#Different`
  3. Submit form
- **Expected**: "Passwords do not match" error

#### Test Case 1.1.5: Duplicate Email
- **Steps**:
  1. Sign up with email already in system
  2. Submit form
- **Expected**: "Email already exists" error from Cognito

### 1.2 Login Flow

#### Test Case 1.2.1: Valid Login
- **Steps**:
  1. Navigate to login page
  2. Enter registered email
  3. Enter correct password
  4. Click "Login" button
- **Expected**: JWT token received, redirect to dashboard, token stored

#### Test Case 1.2.2: Invalid Credentials
- **Test scenarios**:
  - Wrong password
  - Non-existent email
  - Correct email, wrong case (should be case-insensitive)
- **Expected**: "Invalid credentials" error, no redirect

#### Test Case 1.2.3: Empty Fields
- **Test**:
  - Submit with empty email
  - Submit with empty password
  - Submit with both empty
- **Expected**: Field validation errors

#### Test Case 1.2.4: Unverified Email
- **Steps**:
  1. Create account but don't verify email
  2. Attempt login
- **Expected**: "Email not verified" message

### 1.3 Session Management

#### Test Case 1.3.1: Token Expiration (15 minutes)
- **Steps**:
  1. Login successfully
  2. Wait 16 minutes (or manipulate system time)
  3. Attempt any API call
- **Expected**: Auto-redirect to login, session cleared

#### Test Case 1.3.2: Token Refresh
- **Steps**:
  1. Login successfully
  2. Make API calls within 15-minute window
  3. Verify token refresh happens automatically
- **Expected**: Seamless experience, no interruption

#### Test Case 1.3.3: Concurrent Sessions
- **Steps**:
  1. Login on Browser A
  2. Login on Browser B with same account
  3. Perform actions on both
- **Expected**: Both sessions work independently

### 1.4 Password Reset Flow

#### Test Case 1.4.1: Request Password Reset
- **Steps**:
  1. Click "Forgot Password" link
  2. Enter registered email
  3. Submit request
- **Expected**: Reset code sent to email, confirmation message shown

#### Test Case 1.4.2: Invalid Reset Email
- **Steps**:
  1. Enter non-existent email
  2. Submit request
- **Expected**: Generic message (don't reveal if email exists)

#### Test Case 1.4.3: Complete Password Reset
- **Steps**:
  1. Request reset code
  2. Check email for code
  3. Enter code and new password
  4. Submit
- **Expected**: Password updated, can login with new password

#### Test Case 1.4.4: Expired Reset Code
- **Steps**:
  1. Request reset code
  2. Wait for expiration (typically 1 hour)
  3. Attempt to use code
- **Expected**: "Code expired" error

#### Test Case 1.4.5: Invalid Reset Code
- **Steps**:
  1. Enter wrong verification code
  2. Submit
- **Expected**: "Invalid code" error

### 1.5 Logout

#### Test Case 1.5.1: Standard Logout
- **Steps**:
  1. Login successfully
  2. Click logout button
- **Expected**: Token cleared, redirect to login, cannot access protected routes

#### Test Case 1.5.2: Logout from Multiple Tabs
- **Steps**:
  1. Open app in 2 tabs
  2. Logout from Tab 1
  3. Try to use Tab 2
- **Expected**: Tab 2 also logged out or redirects to login

### 1.6 Authorization

#### Test Case 1.6.1: Protected Routes
- **Steps**:
  1. Without logging in, try to access:
     - `/dashboard`
     - `/vehicles`
     - `/refills`
     - `/expenses`
     - `/analytics`
- **Expected**: Redirect to login page

#### Test Case 1.6.2: Direct URL Access
- **Steps**:
  1. Logout
  2. Paste protected route URL in browser
- **Expected**: Redirect to login

#### Test Case 1.6.3: API Authorization
- **Steps**:
  1. Make API call without token
  2. Make API call with invalid token
  3. Make API call with expired token
- **Expected**: 401 Unauthorized response

---

## 2. Vehicle Management Testing

### 2.1 Create Vehicle

#### Test Case 2.1.1: Create First Vehicle
- **Steps**:
  1. Login to fresh account
  2. Navigate to Vehicles page
  3. Click "Add Vehicle" button
  4. Fill required fields:
     - Make: `Toyota`
     - Model: `Camry`
     - Year: `2020`
     - License Plate: `ABC-1234`
     - Initial Odometer: `50000`
  5. Submit form
- **Expected**: Vehicle created, appears in list, auto-selected as active

#### Test Case 2.1.2: Create Additional Vehicles
- **Steps**:
  1. Create second vehicle with different details
  2. Create third vehicle
- **Expected**: All vehicles appear in dropdown, last created is selected

#### Test Case 2.1.3: Required Field Validation
- **Test each field empty**:
  - Submit without Make
  - Submit without Model
  - Submit without Year
  - Submit without License Plate
  - Submit without Initial Odometer
- **Expected**: Field-specific validation errors

#### Test Case 2.1.4: Year Validation
- **Test with**:
  - `1899` (too old)
  - `2050` (future year)
  - `abcd` (non-numeric)
  - `20` (2-digit year)
- **Expected**: "Invalid year" error

#### Test Case 2.1.5: Odometer Validation
- **Test with**:
  - `-100` (negative)
  - `0` (zero - should be allowed)
  - `abc` (non-numeric)
  - `999999999` (very large number)
- **Expected**: Appropriate validation messages

#### Test Case 2.1.6: Optional Fields
- **Steps**:
  1. Create vehicle with only required fields
  2. Create vehicle with all optional fields:
     - VIN
     - Color
     - Fuel Type
     - Tank Capacity
- **Expected**: Both vehicles created successfully

### 2.2 Edit Vehicle

#### Test Case 2.2.1: Edit Basic Details
- **Steps**:
  1. Select vehicle from list
  2. Click edit button
  3. Change Make to `Honda`
  4. Change Model to `Accord`
  5. Save changes
- **Expected**: Changes saved, vehicle list updated

#### Test Case 2.2.2: Edit Odometer
- **Steps**:
  1. Edit vehicle with current odometer `50000`
  2. Try to change to `49000` (lower than current)
- **Expected**: Warning or validation (depends on business logic)

#### Test Case 2.2.3: Edit with Invalid Data
- **Steps**:
  1. Edit vehicle
  2. Clear required field (e.g., Make)
  3. Attempt to save
- **Expected**: Validation error, changes not saved

#### Test Case 2.2.4: Cancel Edit
- **Steps**:
  1. Start editing vehicle
  2. Make changes
  3. Click cancel
- **Expected**: Changes discarded, original data retained

### 2.3 Delete Vehicle

#### Test Case 2.3.1: Delete Vehicle Without Data
- **Steps**:
  1. Create new vehicle
  2. Immediately delete it (no refills/expenses)
  3. Confirm deletion
- **Expected**: Vehicle removed from list

#### Test Case 2.3.2: Delete Vehicle With Data
- **Steps**:
  1. Select vehicle with refills and expenses
  2. Click delete
  3. View warning about associated data
  4. Confirm deletion
- **Expected**: Vehicle and all associated data deleted

#### Test Case 2.3.3: Cancel Deletion
- **Steps**:
  1. Click delete vehicle
  2. Click cancel on confirmation dialog
- **Expected**: Vehicle not deleted

#### Test Case 2.3.4: Delete Last Vehicle
- **Steps**:
  1. Delete all vehicles except one
  2. Attempt to delete last vehicle
- **Expected**: Either prevented or app handles gracefully

### 2.4 Vehicle Selection

#### Test Case 2.4.1: Switch Between Vehicles
- **Steps**:
  1. Create 3 vehicles
  2. Select Vehicle A from dropdown
  3. Verify refills/expenses for Vehicle A shown
  4. Select Vehicle B
  5. Verify data switches to Vehicle B
- **Expected**: Data filtered correctly per vehicle

#### Test Case 2.4.2: Auto-Selection on Login
- **Steps**:
  1. Select Vehicle B
  2. Logout
  3. Login again
- **Expected**: Vehicle B still selected (last used)

#### Test Case 2.4.3: Dropdown Behavior
- **Steps**:
  1. Open vehicle dropdown
  2. Verify all vehicles listed
  3. Verify current vehicle highlighted
  4. Select different vehicle
- **Expected**: Smooth dropdown interaction, immediate switch

#### Test Case 2.4.4: Vehicle Selection Persistence
- **Steps**:
  1. Select vehicle
  2. Navigate to different pages (Refills, Expenses, Analytics)
  3. Verify same vehicle selected on all pages
- **Expected**: Selection persists across navigation

### 2.5 Vehicle Display

#### Test Case 2.5.1: Vehicle Card Display (Mobile)
- **Steps**:
  1. View vehicles on mobile (<640px)
  2. Verify card shows:
     - Make/Model/Year
     - License Plate
     - Current Odometer
     - No radio buttons (per requirements)
- **Expected**: Clean card layout, touch-friendly

#### Test Case 2.5.2: Vehicle List Display (Desktop)
- **Steps**:
  1. View vehicles on desktop (≥1024px)
  2. Verify table/list shows all details
  3. Check hover states
- **Expected**: Enhanced visual hierarchy, hover effects

#### Test Case 2.5.3: Empty State
- **Steps**:
  1. Login to account with no vehicles
  2. View vehicles page
- **Expected**: "No vehicles" message, "Add Vehicle" CTA prominent

---

## 3. Refill Tracking Testing

### 3.1 Add Refill - Full Tank

#### Test Case 3.1.1: Standard Full Tank Refill
- **Steps**:
  1. Select vehicle with current odometer `50000`
  2. Click "Add Refill" (inline form appears)
  3. Enter date: `2024-01-15`
  4. Enter odometer: `50250` (250 km driven)
  5. Enter volume: `45.5` liters
  6. Enter price per liter: `1.50`
  7. Check "Full Tank" checkbox
  8. Select fuel type: `Gasoline 95`
  9. Select driving type: `Mixed`
  10. Select currency: `USD`
  11. Submit form
- **Expected**: 
  - Refill created
  - Total cost calculated: `$68.25`
  - Fuel efficiency calculated (if previous refill exists)
  - Inline form closes
  - List updates immediately

#### Test Case 3.1.2: Full Tank with UAH Currency
- **Steps**:
  1. Add refill with same data
  2. Select currency: `UAH`
  3. Enter price per liter: `60` UAH
  4. Submit
- **Expected**:
  - Total cost: `₴2,730 ($68.25)`
  - Exchange rate stored: `40`
  - Base amount: `$68.25`

#### Test Case 3.1.3: Fuel Type Default
- **Steps**:
  1. Add first refill with fuel type `Gasoline 95`
  2. Add second refill
  3. Check fuel type field
- **Expected**: Fuel type pre-filled with `Gasoline 95` from last refill

### 3.2 Add Refill - Partial Fill

#### Test Case 3.2.1: Partial Fill Entry
- **Steps**:
  1. Add refill
  2. Uncheck "Full Tank" checkbox
  3. Enter all other required fields
  4. Submit
- **Expected**: 
  - Refill created with `isFull: false`
  - Efficiency calculation uses running average method
  - Marked as partial in list

#### Test Case 3.2.2: Multiple Partial Fills
- **Steps**:
  1. Add 3 consecutive partial fills
  2. View efficiency calculations
- **Expected**: Running average efficiency calculated correctly

### 3.3 Refill Validation

#### Test Case 3.3.1: Odometer Must Increase
- **Steps**:
  1. Last refill odometer: `50250`
  2. Try to add refill with odometer: `50200`
  3. Submit
- **Expected**: "Odometer must be greater than or equal to previous" error

#### Test Case 3.3.2: Odometer Equal to Previous
- **Steps**:
  1. Last refill odometer: `50250`
  2. Add refill with odometer: `50250`
  3. Submit
- **Expected**: Allowed (same-day multiple refills scenario)

#### Test Case 3.3.3: Required Fields
- **Test each field empty**:
  - Date
  - Odometer
  - Volume
  - Price per liter
- **Expected**: Field-specific validation errors

#### Test Case 3.3.4: Numeric Validation
- **Test with**:
  - Volume: `-10` (negative)
  - Volume: `0` (zero)
  - Volume: `abc` (non-numeric)
  - Price: `-5.50` (negative)
  - Price: `0` (zero - should be allowed for free fuel)
- **Expected**: Appropriate validation messages

#### Test Case 3.3.5: Date Validation
- **Test with**:
  - Future date (tomorrow)
  - Very old date (1900-01-01)
  - Invalid format (13/45/2024)
- **Expected**: Date validation errors

### 3.4 Driving Type Tagging

#### Test Case 3.4.1: City Driving
- **Steps**:
  1. Add refill
  2. Select driving type: `City`
  3. Submit
- **Expected**: Refill tagged with `drivingType: 'city'`

#### Test Case 3.4.2: Highway Driving
- **Steps**:
  1. Add refill
  2. Select driving type: `Highway`
  3. Submit
- **Expected**: Refill tagged with `drivingType: 'highway'`

#### Test Case 3.4.3: Mixed Driving (Default)
- **Steps**:
  1. Add refill
  2. Don't change driving type
  3. Submit
- **Expected**: Defaults to `drivingType: 'mixed'`

#### Test Case 3.4.4: Driving Type in Analytics
- **Steps**:
  1. Add refills with different driving types
  2. Navigate to Analytics
  3. View efficiency trends
- **Expected**: Separate trend lines for city/highway/mixed

### 3.5 Edit Refill

#### Test Case 3.5.1: Edit Recent Refill
- **Steps**:
  1. Click edit on refill
  2. Change volume from `45.5` to `50.0`
  3. Save changes
- **Expected**: 
  - Refill updated
  - Total cost recalculated
  - Efficiency recalculated
  - List updates immediately

#### Test Case 3.5.2: Edit Odometer (Middle Entry)
- **Steps**:
  1. Have 3 refills: A(50000), B(50250), C(50500)
  2. Edit B's odometer to `50300`
  3. Save
- **Expected**: 
  - Update allowed (still between A and C)
  - Efficiency recalculated for affected entries

#### Test Case 3.5.3: Edit Odometer (Validation)
- **Steps**:
  1. Have refills: A(50000), B(50250), C(50500)
  2. Edit B's odometer to `50600` (higher than C)
  3. Attempt to save
- **Expected**: Validation error (breaks sequence)

#### Test Case 3.5.4: Change Full Tank Status
- **Steps**:
  1. Edit full tank refill
  2. Uncheck "Full Tank"
  3. Save
- **Expected**: 
  - Status updated
  - Efficiency calculations adjusted

#### Test Case 3.5.5: Cancel Edit
- **Steps**:
  1. Start editing refill
  2. Make changes
  3. Click cancel
- **Expected**: Changes discarded, inline form closes

### 3.6 Delete Refill

#### Test Case 3.6.1: Delete Recent Refill
- **Steps**:
  1. Select refill
  2. Click delete
  3. Confirm deletion
- **Expected**: 
  - Refill removed
  - Efficiency recalculated for remaining entries
  - List updates immediately

#### Test Case 3.6.2: Delete Middle Refill
- **Steps**:
  1. Have 5 refills
  2. Delete 3rd refill
  3. Confirm
- **Expected**: 
  - Refill removed
  - Efficiency calculations adjusted
  - No gaps in data

#### Test Case 3.6.3: Delete First Refill
- **Steps**:
  1. Delete oldest refill
  2. Confirm
- **Expected**: 
  - Refill removed
  - Next refill becomes baseline

#### Test Case 3.6.4: Cancel Deletion
- **Steps**:
  1. Click delete
  2. Click cancel on confirmation
- **Expected**: Refill not deleted

### 3.7 Refill Calculations

#### Test Case 3.7.1: Total Cost Calculation
- **Test**:
  - Volume: `45.5` L
  - Price: `1.50` USD/L
  - Expected: `$68.25`
- **Verify**: 2 decimal places, dot separator

#### Test Case 3.7.2: Fuel Efficiency (Full Tank Method)
- **Setup**:
  - Refill A: Odometer `50000`, Volume `45` L, Full Tank
  - Refill B: Odometer `50450`, Volume `50` L, Full Tank
- **Expected**: 
  - Distance: `450` km
  - Efficiency: `450 / 50 = 9.0` km/L or `11.11` L/100km

#### Test Case 3.7.3: Running Average Efficiency
- **Setup**:
  - Last 10 refills with varying efficiency
- **Expected**: 
  - Average of last 10 calculated correctly
  - Smoothed trend line

#### Test Case 3.7.4: Currency Conversion
- **Test**:
  - UAH refill: `₴2,000` at rate `40`
  - Expected base amount: `$50.00`
- **Verify**: Stored correctly in database

### 3.8 Refill Display

#### Test Case 3.8.1: List View (Desktop ≥1400px)
- **Steps**:
  1. View refills on large screen
  2. Verify table columns:
     - Date
     - Odometer
     - Volume
     - Price/L
     - Total Cost
     - Fuel Type
     - Driving Type Badge
     - Full/Partial indicator
     - Actions (Edit/Delete)
- **Expected**: Clean table layout, all data visible

#### Test Case 3.8.2: Card View (Mobile <1400px)
- **Steps**:
  1. View refills on mobile
  2. Verify card shows:
     - Date (no time)
     - Odometer
     - Volume + Fuel Type
     - Total Cost with currency symbol
     - Driving type badge
     - Full/Partial indicator
- **Expected**: Touch-friendly cards, thumb-zone optimized

#### Test Case 3.8.3: Empty State
- **Steps**:
  1. View refills for vehicle with no data
- **Expected**: "No refills yet" message, "Add Refill" CTA

#### Test Case 3.8.4: Inline Form Display
- **Steps**:
  1. Click "Add Refill"
  2. Verify inline form appears at top of list
  3. Verify form fields layout
- **Expected**: Form appears smoothly, fields properly aligned

---

## 4. Expense Management Testing

### 4.1 Add Expense - All Categories

#### Test Case 4.1.1: Maintenance Expense
- **Steps**:
  1. Click "Add Expense"
  2. Select category: `Maintenance`
  3. Enter date: `2024-01-15`
  4. Enter amount: `150.00`
  5. Select currency: `USD`
  6. Enter description: `Oil change`
  7. Enter odometer: `50500`
  8. Submit
- **Expected**: 
  - Expense created
  - Category badge shown
  - Odometer triggers reminder check
  - List updates immediately

#### Test Case 4.1.2: Test All 15 Categories
- **Categories to test**:
  1. Maintenance
  2. Repair
  3. Insurance
  4. Registration
  5. Parking
  6. Tolls
  7. Washing
  8. Accessories
  9. Tires
  10. Battery
  11. Brakes
  12. Engine
  13. Transmission
  14. Electrical
  15. Other
- **Expected**: Each category creates expense with correct badge/icon

#### Test Case 4.1.3: Expense with UAH Currency
- **Steps**:
  1. Add expense
  2. Select currency: `UAH`
  3. Enter amount: `4000`
  4. Submit
- **Expected**: 
  - Display: `₴4,000 ($100.00)`
  - Base amount: `$100.00`
  - Exchange rate: `40`

### 4.2 Expense with Odometer

#### Test Case 4.2.1: Odometer Triggers Reminder Check
- **Setup**:
  1. Create reminder: "Oil change at 51000 km"
  2. Current odometer: `50500`
- **Steps**:
  1. Add expense with odometer: `51200`
  2. Submit
- **Expected**: 
  - Expense created
  - Overdue reminder alert dialog appears
  - Dialog shows odometer: `51200`
  - Reminder marked as overdue

#### Test Case 4.2.2: Odometer Below Reminder Threshold
- **Setup**:
  1. Reminder at `51000` km
- **Steps**:
  1. Add expense with odometer: `50800`
  2. Submit
- **Expected**: 
  - Expense created
  - No reminder alert
  - Reminder still pending

#### Test Case 4.2.3: Multiple Overdue Reminders
- **Setup**:
  1. Reminder A at `51000` km
  2. Reminder B at `51500` km
  3. Current odometer: `50500`
- **Steps**:
  1. Add expense with odometer: `52000`
  2. Submit
- **Expected**: 
  - Alert shows both overdue reminders
  - Both marked as overdue

#### Test Case 4.2.4: Expense Without Odometer
- **Steps**:
  1. Add expense
  2. Leave odometer field empty
  3. Submit
- **Expected**: 
  - Expense created (odometer optional)
  - No reminder check triggered

### 4.3 Expense Validation

#### Test Case 4.3.1: Required Fields
- **Test each field empty**:
  - Category
  - Date
  - Amount
  - Currency
- **Expected**: Field-specific validation errors

#### Test Case 4.3.2: Amount Validation
- **Test with**:
  - `-50` (negative)
  - `0` (zero - should be allowed)
  - `abc` (non-numeric)
  - `999999.99` (very large)
  - `50.123` (3 decimals)
- **Expected**: 
  - Negative rejected
  - Zero allowed
  - Non-numeric rejected
  - Large numbers allowed
  - Rounded to 2 decimals

#### Test Case 4.3.3: Description Length
- **Test with**:
  - Empty (should be optional)
  - 500 characters
  - 1000 characters
- **Expected**: 
  - Empty allowed
  - Long descriptions handled gracefully

#### Test Case 4.3.4: Odometer Validation
- **Test with**:
  - Lower than vehicle's current odometer
  - Equal to current odometer
  - Much higher than current (e.g., +10000 km)
- **Expected**: 
  - Warning for lower values
  - Equal allowed
  - High values allowed with confirmation

### 4.4 Edit Expense

#### Test Case 4.4.1: Edit Amount
- **Steps**:
  1. Click edit on expense
  2. Change amount from `150.00` to `175.50`
  3. Save
- **Expected**: 
  - Expense updated
  - Analytics recalculated
  - List updates immediately

#### Test Case 4.4.2: Change Category
- **Steps**:
  1. Edit expense
  2. Change category from `Maintenance` to `Repair`
  3. Save
- **Expected**: 
  - Category updated
  - Badge changes
  - Category totals recalculated

#### Test Case 4.4.3: Change Currency
- **Steps**:
  1. Edit USD expense
  2. Change to UAH
  3. Adjust amount accordingly
  4. Save
- **Expected**: 
  - Currency updated
  - Base amount recalculated
  - Display format changes

#### Test Case 4.4.4: Edit Odometer
- **Steps**:
  1. Edit expense with odometer `51000`
  2. Change to `51500`
  3. Save
- **Expected**: 
  - Odometer updated
  - Reminder check triggered again
  - May show new overdue alerts

#### Test Case 4.4.5: Cancel Edit
- **Steps**:
  1. Start editing
  2. Make changes
  3. Click cancel
- **Expected**: Changes discarded, inline form closes

### 4.5 Delete Expense

#### Test Case 4.5.1: Delete Expense
- **Steps**:
  1. Click delete on expense
  2. Confirm deletion
- **Expected**: 
  - Expense removed
  - Analytics recalculated
  - List updates immediately

#### Test Case 4.5.2: Delete Expense That Triggered Reminder
- **Steps**:
  1. Expense with odometer `51200` triggered reminder
  2. Delete expense
  3. Confirm
- **Expected**: 
  - Expense deleted
  - Reminder status unchanged (already marked overdue)

#### Test Case 4.5.3: Cancel Deletion
- **Steps**:
  1. Click delete
  2. Click cancel
- **Expected**: Expense not deleted

### 4.6 Expense Display

#### Test Case 4.6.1: List View (Desktop ≥1400px)
- **Steps**:
  1. View expenses on large screen
  2. Verify table columns:
     - Date
     - Category (with badge)
     - Description
     - Amount (with currency)
     - Odometer
     - Actions
- **Expected**: Clean table layout, category badges visible

#### Test Case 4.6.2: Card View (Mobile <1400px)
- **Steps**:
  1. View expenses on mobile
  2. Verify card shows:
     - Date (no time)
     - Category badge
     - Description
     - Amount with currency symbol
     - Odometer (if present)
- **Expected**: Touch-friendly cards, clear hierarchy

#### Test Case 4.6.3: Category Badges
- **Verify**:
  - Each category has distinct color
  - Badge text readable
  - Icons (if present) appropriate
- **Expected**: Visual distinction between categories

#### Test Case 4.6.4: Empty State
- **Steps**:
  1. View expenses for vehicle with no data
- **Expected**: "No expenses yet" message, "Add Expense" CTA

#### Test Case 4.6.5: Currency Display
- **Verify**:
  - USD: `$150.00`
  - UAH: `₴4,000 ($100.00)`
  - Proper formatting with commas
  - 2 decimal places
- **Expected**: Consistent currency formatting

### 4.7 Expense Analytics Integration

#### Test Case 4.7.1: Category Totals
- **Steps**:
  1. Add expenses in multiple categories
  2. Navigate to Analytics
  3. View category breakdown
- **Expected**: 
  - Correct totals per category
  - Percentages calculated
  - Chart displays properly

#### Test Case 4.7.2: Monthly Expense Trends
- **Steps**:
  1. Add expenses across multiple months
  2. View expense trend chart
- **Expected**: 
  - Monthly totals correct
  - Trend line accurate
  - All currencies converted to base

#### Test Case 4.7.3: Total Expenses Calculation
- **Steps**:
  1. Add 5 expenses with mixed currencies
  2. View total expenses stat
- **Expected**: 
  - All converted to base currency
  - Total accurate
  - Displayed in user's preferred currency

---

## 5. Reminder System Testing

### 5.1 Create Reminder

#### Test Case 5.1.1: Odometer-Based Reminder
- **Steps**:
  1. Navigate to Reminders
  2. Click "Add Reminder"
  3. Enter title: `Oil Change`
  4. Select type: `Odometer`
  5. Enter threshold: `55000` km
  6. Enter description: `Regular maintenance`
  7. Enable notifications (web push + email)
  8. Submit
- **Expected**: 
  - Reminder created
  - Status: `Pending`
  - Appears in reminders list

#### Test Case 5.1.2: Date-Based Reminder
- **Steps**:
  1. Add reminder
  2. Select type: `Date`
  3. Enter due date: `2024-06-01`
  4. Enter title: `Insurance Renewal`
  5. Submit
- **Expected**: 
  - Reminder created
  - Shows days until due
  - Status: `Pending`

#### Test Case 5.1.3: Recurring Reminder
- **Steps**:
  1. Add reminder
  2. Check "Recurring" checkbox
  3. Select interval: `Every 6 months`
  4. Submit
- **Expected**: 
  - Reminder created with recurrence
  - Next occurrence calculated

#### Test Case 5.1.4: Reminder with Notifications Disabled
- **Steps**:
  1. Add reminder
  2. Uncheck web push
  3. Uncheck email
  4. Submit
- **Expected**: 
  - Reminder created
  - No notifications sent
  - Manual check only

### 5.2 Edit Reminder

#### Test Case 5.2.1: Change Threshold
- **Steps**:
  1. Edit odometer reminder
  2. Change threshold from `55000` to `60000`
  3. Save
- **Expected**: 
  - Threshold updated
  - Status recalculated
  - List updates

#### Test Case 5.2.2: Change Reminder Type
- **Steps**:
  1. Edit odometer reminder
  2. Change to date-based
  3. Enter due date
  4. Save
- **Expected**: 
  - Type changed
  - Relevant fields updated
  - Status recalculated

#### Test Case 5.2.3: Toggle Notifications
- **Steps**:
  1. Edit reminder
  2. Enable/disable web push
  3. Enable/disable email
  4. Save
- **Expected**: 
  - Notification preferences updated
  - Future notifications respect settings

#### Test Case 5.2.4: Cancel Edit
- **Steps**:
  1. Start editing
  2. Make changes
  3. Cancel
- **Expected**: Changes discarded

### 5.3 Delete Reminder

#### Test Case 5.3.1: Delete Pending Reminder
- **Steps**:
  1. Select pending reminder
  2. Click delete
  3. Confirm
- **Expected**: Reminder removed from list

#### Test Case 5.3.2: Delete Overdue Reminder
- **Steps**:
  1. Select overdue reminder
  2. Delete
  3. Confirm
- **Expected**: Reminder removed, no longer shows in alerts

#### Test Case 5.3.3: Delete Completed Reminder
- **Steps**:
  1. Select completed reminder
  2. Delete
  3. Confirm
- **Expected**: Reminder removed from history

#### Test Case 5.3.4: Cancel Deletion
- **Steps**:
  1. Click delete
  2. Cancel
- **Expected**: Reminder not deleted

### 5.4 Mark Reminder as Completed

#### Test Case 5.4.1: Complete Pending Reminder
- **Steps**:
  1. Select pending reminder
  2. Click "Mark as Completed"
  3. Optionally add completion notes
  4. Confirm
- **Expected**: 
  - Status: `Completed`
  - Completion date recorded
  - Moved to completed section

#### Test Case 5.4.2: Complete Overdue Reminder
- **Steps**:
  1. Select overdue reminder
  2. Mark as completed
  3. Confirm
- **Expected**: 
  - Status: `Completed`
  - No longer shows in overdue alerts

#### Test Case 5.4.3: Complete Recurring Reminder
- **Steps**:
  1. Complete recurring reminder
  2. Confirm
- **Expected**: 
  - Current instance marked completed
  - Next occurrence created automatically
  - New due date calculated

### 5.5 Overdue Reminder Alerts

#### Test Case 5.5.1: Alert on Refill with Odometer Update
- **Setup**:
  1. Reminder at `55000` km
  2. Current odometer: `54500`
- **Steps**:
  1. Add refill with odometer: `55500`
  2. Submit refill
- **Expected**: 
  - Refill created successfully
  - Overdue reminder dialog appears immediately
  - Dialog shows:
    - Reminder title
    - Threshold: `55000`
    - Current odometer: `55500`
    - "Mark as Completed" button
    - "Dismiss" button

#### Test Case 5.5.2: Alert on Expense with Odometer Update
- **Setup**:
  1. Reminder at `55000` km
  2. Current odometer: `54500`
- **Steps**:
  1. Add expense with odometer: `55200`
  2. Submit expense
- **Expected**: 
  - Expense created
  - Overdue alert appears
  - Shows exact odometer: `55200`

#### Test Case 5.5.3: Multiple Overdue Alerts
- **Setup**:
  1. Reminder A at `55000` km
  2. Reminder B at `55500` km
  3. Reminder C at `56000` km
  4. Current odometer: `54500`
- **Steps**:
  1. Add refill with odometer: `56500`
  2. Submit
- **Expected**: 
  - Alert shows all 3 overdue reminders
  - Each with details
  - Option to mark each individually

#### Test Case 5.5.4: Dismiss Alert
- **Steps**:
  1. Trigger overdue alert
  2. Click "Dismiss"
- **Expected**: 
  - Dialog closes
  - Reminder remains overdue
  - Can be accessed from Reminders page

#### Test Case 5.5.5: Mark as Completed from Alert
- **Steps**:
  1. Trigger overdue alert
  2. Click "Mark as Completed" on reminder
  3. Confirm
- **Expected**: 
  - Reminder marked completed
  - Removed from alert
  - Dialog closes if no more overdue

### 5.6 Web Push Notifications

#### Test Case 5.6.1: Subscribe to Push Notifications
- **Steps**:
  1. Navigate to Settings/Notifications
  2. Click "Enable Push Notifications"
  3. Grant browser permission
- **Expected**: 
  - Permission granted
  - Subscription created
  - Stored in backend

#### Test Case 5.6.2: Receive Push Notification
- **Setup**:
  1. Reminder due tomorrow
  2. EventBridge scheduled check runs
- **Expected**: 
  - Push notification received
  - Shows reminder title
  - Click opens app to reminders page

#### Test Case 5.6.3: Unsubscribe from Push
- **Steps**:
  1. Navigate to Settings
  2. Click "Disable Push Notifications"
  3. Confirm
- **Expected**: 
  - Subscription removed
  - No more push notifications

#### Test Case 5.6.4: Push on Multiple Devices
- **Steps**:
  1. Subscribe on Desktop
  2. Subscribe on Mobile
  3. Trigger reminder
- **Expected**: Both devices receive notification

### 5.7 Email Notifications

#### Test Case 5.7.1: Receive Email Notification
- **Setup**:
  1. Reminder due tomorrow
  2. Email notifications enabled
  3. EventBridge scheduled check runs
- **Expected**: 
  - Email sent via SES
  - Contains reminder details
  - Link to app

#### Test Case 5.7.2: Email Content Verification
- **Verify email contains**:
  - Reminder title
  - Due date/odometer
  - Vehicle details
  - Link to mark as completed
  - Unsubscribe link
- **Expected**: Professional, branded email

#### Test Case 5.7.3: Disable Email Notifications
- **Steps**:
  1. Navigate to Settings
  2. Uncheck "Email Notifications"
  3. Save
- **Expected**: 
  - Preference saved
  - No more emails sent

#### Test Case 5.7.4: Email Delivery Failure
- **Setup**:
  1. Invalid email in user profile
  2. Trigger notification
- **Expected**: 
  - SES bounce handled
  - Error logged
  - User notified (in-app)

### 5.8 Scheduled Reminder Checks

#### Test Case 5.8.1: EventBridge Daily Check
- **Setup**:
  1. Multiple reminders with various due dates
  2. Wait for scheduled check (or trigger manually)
- **Expected**: 
  - Lambda function executes
  - Checks all reminders
  - Sends notifications for due reminders
  - Logs execution

#### Test Case 5.8.2: Reminder Due Today
- **Setup**:
  1. Date-based reminder due today
  2. Scheduled check runs
- **Expected**: 
  - Notification sent
  - Status updated to `Due`

#### Test Case 5.8.3: Reminder Due in 3 Days (Advance Notice)
- **Setup**:
  1. Reminder due in 3 days
  2. Advance notice enabled
  3. Scheduled check runs
- **Expected**: 
  - Advance notification sent
  - Status remains `Pending`

#### Test Case 5.8.4: No Reminders Due
- **Setup**:
  1. All reminders in future
  2. Scheduled check runs
- **Expected**: 
  - No notifications sent
  - Execution completes successfully

### 5.9 Reminder Display

#### Test Case 5.9.1: Reminders List View
- **Steps**:
  1. View reminders page
  2. Verify sections:
     - Overdue (red)
     - Due Soon (yellow)
     - Pending (green)
     - Completed (gray)
- **Expected**: Clear visual hierarchy, color-coded

#### Test Case 5.9.2: Reminder Card Details
- **Verify each card shows**:
  - Title
  - Type (odometer/date)
  - Threshold/due date
  - Status badge
  - Days remaining or km remaining
  - Notification icons (if enabled)
  - Actions (Edit/Delete/Complete)
- **Expected**: All info visible, touch-friendly

#### Test Case 5.9.3: Empty States
- **Test**:
  - No reminders at all
  - No overdue reminders
  - No pending reminders
- **Expected**: Appropriate empty state messages

#### Test Case 5.9.4: Reminder Sorting
- **Verify**:
  - Overdue sorted by urgency
  - Pending sorted by due date/odometer
  - Completed sorted by completion date
- **Expected**: Logical ordering

---

## 6. Analytics & Charts Testing

### 6.1 Statistics Cards

#### Test Case 6.1.1: Total Fuel Cost
- **Steps**:
  1. Add refills with mixed currencies
  2. Navigate to Analytics
  3. View "Total Fuel Cost" card
- **Expected**: 
  - All refills converted to base currency
  - Correct sum displayed
  - Currency symbol shown

#### Test Case 6.1.2: Average Fuel Efficiency
- **Steps**:
  1. Add multiple full-tank refills
  2. View efficiency card
- **Expected**: 
  - Running average displayed
  - Unit shown (L/100km or mpg)
  - Trend indicator (↑↓)

#### Test Case 6.1.3: Total Expenses
- **Steps**:
  1. Add expenses in various categories
  2. View total expenses card
- **Expected**: 
  - All expenses summed
  - Currency converted
  - Accurate total

#### Test Case 6.1.4: Cost Per Kilometer
- **Steps**:
  1. Calculate: (Total Fuel + Total Expenses) / Total Distance
  2. View cost per km card
- **Expected**: 
  - Accurate calculation
  - Displayed with 2 decimals
  - Currency symbol

### 6.2 Fuel Efficiency Charts

#### Test Case 6.2.1: Overall Efficiency Trend
- **Steps**:
  1. Add 10+ refills over time
  2. View efficiency trend chart
- **Expected**: 
  - Line chart with data points
  - X-axis: dates
  - Y-axis: efficiency (L/100km or mpg)
  - Smooth trend line

#### Test Case 6.2.2: City Efficiency Trend
- **Steps**:
  1. Add refills tagged as "City"
  2. View multi-line chart
  3. Check city trend line
- **Expected**: 
  - Separate line for city driving
  - Distinct color
  - Legend shows "City"

#### Test Case 6.2.3: Highway Efficiency Trend
- **Steps**:
  1. Add refills tagged as "Highway"
  2. View chart
- **Expected**: 
  - Highway trend line visible
  - Different color from city
  - Legend shows "Highway"

#### Test Case 6.2.4: Mixed Efficiency Trend
- **Steps**:
  1. Add refills tagged as "Mixed"
  2. View chart
- **Expected**: 
  - Mixed trend line shown
  - Distinct color
  - Legend shows "Mixed"

#### Test Case 6.2.5: All Driving Types Together
- **Steps**:
  1. Have refills of all types
  2. View multi-line chart
- **Expected**: 
  - 4 lines: Overall, City, Highway, Mixed
  - All visible and distinguishable
  - Interactive legend (toggle lines)

### 6.3 Expense Charts

#### Test Case 6.3.1: Expense by Category (Pie Chart)
- **Steps**:
  1. Add expenses in 5+ categories
  2. View category breakdown chart
- **Expected**: 
  - Pie/donut chart
  - Each category with distinct color
  - Percentages shown
  - Legend with category names

#### Test Case 6.3.2: Monthly Expense Trend (Bar Chart)
- **Steps**:
  1. Add expenses across 6 months
  2. View monthly trend chart
- **Expected**: 
  - Bar chart with monthly totals
  - X-axis: months
  - Y-axis: amount
  - Hover shows exact values

#### Test Case 6.3.3: Expense vs Fuel Cost Comparison
- **Steps**:
  1. View comparison chart
- **Expected**: 
  - Two data series
  - Clear distinction
  - Accurate totals

### 6.4 Chart Interactions

#### Test Case 6.4.1: Hover Tooltips
- **Steps**:
  1. Hover over data points
  2. Verify tooltip shows:
     - Date
     - Value
     - Additional context
- **Expected**: Tooltips appear smoothly, readable

#### Test Case 6.4.2: Legend Toggle
- **Steps**:
  1. Click legend item to hide/show line
  2. Verify line visibility toggles
- **Expected**: Interactive legend works

#### Test Case 6.4.3: Zoom/Pan (if implemented)
- **Steps**:
  1. Try to zoom into chart
  2. Try to pan across data
- **Expected**: Smooth interaction

#### Test Case 6.4.4: Responsive Charts
- **Steps**:
  1. View charts on mobile
  2. View charts on tablet
  3. View charts on desktop
- **Expected**: Charts resize appropriately, remain readable

### 6.5 Date Range Filtering

#### Test Case 6.5.1: Last 30 Days
- **Steps**:
  1. Select "Last 30 Days" filter
  2. View analytics
- **Expected**: Only data from last 30 days shown

#### Test Case 6.5.2: Last 6 Months
- **Steps**:
  1. Select "Last 6 Months"
  2. View analytics
- **Expected**: 6 months of data displayed

#### Test Case 6.5.3: Custom Date Range
- **Steps**:
  1. Select "Custom"
  2. Enter start date: `2024-01-01`
  3. Enter end date: `2024-03-31`
  4. Apply filter
- **Expected**: Only Q1 2024 data shown

#### Test Case 6.5.4: All Time
- **Steps**:
  1. Select "All Time"
  2. View analytics
- **Expected**: Complete historical data displayed

---

## 7. Data Operations Testing

### 7.1 Infinite Scroll

#### Test Case 7.1.1: Initial Load
- **Steps**:
  1. Navigate to Refills page
  2. Observe initial data load
- **Expected**: 
  - First month of data loaded
  - Loading indicator shown
  - Smooth rendering

#### Test Case 7.1.2: Scroll to Load More
- **Steps**:
  1. Scroll to bottom of list
  2. Wait for next page to load
- **Expected**: 
  - Next month loaded automatically
  - No duplicate entries
  - Smooth transition

#### Test Case 7.1.3: Load All Historical Data
- **Steps**:
  1. Keep scrolling until all data loaded
  2. Verify "No more data" indicator
- **Expected**: 
  - All data eventually loaded
  - Clear end-of-list indicator

#### Test Case 7.1.4: Scroll Performance
- **Steps**:
  1. Scroll rapidly through large dataset
  2. Monitor performance
- **Expected**: 
  - No lag or jank
  - Smooth scrolling
  - Efficient rendering

### 7.2 CSV Export

#### Test Case 7.2.1: Export Refills
- **Steps**:
  1. Navigate to Refills
  2. Click "Export CSV"
  3. Download file
  4. Open in spreadsheet app
- **Expected**: 
  - CSV file downloaded
  - All refills included
  - Proper headers
  - Data formatted correctly

#### Test Case 7.2.2: Export Expenses
- **Steps**:
  1. Navigate to Expenses
  2. Export CSV
  3. Verify file
- **Expected**: 
  - All expenses exported
  - Categories included
  - Currency data preserved

#### Test Case 7.2.3: Export with Date Range
- **Steps**:
  1. Select date range filter
  2. Export CSV
  3. Verify only filtered data exported
- **Expected**: Only data within range included

#### Test Case 7.2.4: Export Empty Dataset
- **Steps**:
  1. Export from vehicle with no data
- **Expected**: 
  - CSV with headers only
  - Or appropriate message

### 7.3 CSV Import

#### Test Case 7.3.1: Import Valid Refills CSV
- **Steps**:
  1. Prepare CSV with valid refill data
  2. Click "Import CSV"
  3. Select file
  4. Map columns
  5. Import
- **Expected**: 
  - All rows imported
  - Data appears in list
  - Success message shown

#### Test Case 7.3.2: Import with Invalid Data
- **Steps**:
  1. CSV with invalid dates, negative values
  2. Attempt import
- **Expected**: 
  - Validation errors shown
  - Invalid rows highlighted
  - Option to fix or skip

#### Test Case 7.3.3: Import with Missing Columns
- **Steps**:
  1. CSV missing required column (e.g., odometer)
  2. Attempt import
- **Expected**: 
  - Error message
  - Import prevented
  - Guidance on required columns

#### Test Case 7.3.4: Import Duplicate Detection
- **Steps**:
  1. Import CSV with entries already in system
  2. Check for duplicates
- **Expected**: 
  - Duplicates detected
  - Option to skip or overwrite

### 7.4 Optimistic UI Updates

#### Test Case 7.4.1: Add Entry with Optimistic Update
- **Steps**:
  1. Add refill
  2. Observe immediate UI update
  3. Wait for API confirmation
- **Expected**: 
  - Entry appears immediately
  - No loading state
  - Confirmed after API response

#### Test Case 7.4.2: Failed API Call Rollback
- **Steps**:
  1. Simulate network failure
  2. Add refill
  3. Observe rollback
- **Expected**: 
  - Entry appears briefly
  - Rolls back on error
  - Error message shown

#### Test Case 7.4.3: Edit with Optimistic Update
- **Steps**:
  1. Edit entry
  2. Observe immediate change
  3. Verify after API confirmation
- **Expected**: 
  - Changes appear immediately
  - Confirmed or rolled back

#### Test Case 7.4.4: Delete with Optimistic Update
- **Steps**:
  1. Delete entry
  2. Observe immediate removal
  3. Verify after API confirmation
- **Expected**: 
  - Entry removed immediately
  - Restored if API fails

---

## 8. User Profile Testing

### 8.1 View Profile

#### Test Case 8.1.1: Access Profile Settings
- **Steps**:
  1. Click user menu
  2. Select "Settings" or "Profile"
  3. View profile page
- **Expected**: 
  - Profile page loads
  - Current data displayed
  - Edit form available

#### Test Case 8.1.2: Display Current Information
- **Verify displayed**:
  - Email (read-only)
  - First Name
  - Last Name
  - Preferred Currency
  - Preferred Units (metric/imperial)
  - Language
- **Expected**: All current values shown correctly

### 8.2 Edit Profile

#### Test Case 8.2.1: Edit First Name
- **Steps**:
  1. Change firstName from `John` to `Jonathan`
  2. Click "Save"
- **Expected**: 
  - Name updated
  - Success message
  - Displayed throughout app

#### Test Case 8.2.2: Edit Last Name
- **Steps**:
  1. Change lastName from `Doe` to `Smith`
  2. Save
- **Expected**: 
  - Name updated
  - Success message

#### Test Case 8.2.3: Edit Both Names
- **Steps**:
  1. Change both firstName and lastName
  2. Save
- **Expected**: Both updated successfully

#### Test Case 8.2.4: Empty Name Validation
- **Steps**:
  1. Clear firstName
  2. Attempt to save
- **Expected**: 
  - Validation error
  - "First name required"
  - Not saved

#### Test Case 8.2.5: Change Preferred Currency
- **Steps**:
  1. Change from USD to UAH
  2. Save
  3. Navigate to Refills/Expenses
- **Expected**: 
  - Currency preference saved
  - Display format changes throughout app

#### Test Case 8.2.6: Change Preferred Units
- **Steps**:
  1. Change from metric (L/100km) to imperial (mpg)
  2. Save
  3. View analytics
- **Expected**: 
  - Units updated
  - Efficiency displayed in mpg
  - Conversions accurate

#### Test Case 8.2.7: Change Language
- **Steps**:
  1. Change from English to Ukrainian
  2. Save
- **Expected**: 
  - Language updated
  - Entire app switches to Ukrainian
  - Preference persisted

### 8.3 Profile Validation

#### Test Case 8.3.1: Name Length Limits
- **Test with**:
  - Very long firstName (100+ chars)
  - Very long lastName (100+ chars)
- **Expected**: 
  - Character limit enforced
  - Or handled gracefully

#### Test Case 8.3.2: Special Characters in Names
- **Test with**:
  - Names with accents: `José`, `François`
  - Names with hyphens: `Mary-Jane`
  - Names with apostrophes: `O'Brien`
- **Expected**: All accepted and stored correctly

#### Test Case 8.3.3: Cancel Edit
- **Steps**:
  1. Make changes to profile
  2. Click cancel
- **Expected**: Changes discarded, original values retained

---

## 9. Cross-Browser Testing

### 9.1 Chrome (Latest)

#### Test Case 9.1.1: Full Functionality Test
- **Test on**: Chrome 120+
- **Verify**:
  - All features work
  - Charts render correctly
  - Forms submit properly
  - PWA installable
  - Service worker registers
- **Expected**: Full compatibility

#### Test Case 9.1.2: Chrome DevTools Testing
- **Steps**:
  1. Open DevTools
  2. Check Console for errors
  3. Check Network tab for failed requests
  4. Check Application tab for storage
- **Expected**: No errors, proper caching

### 9.2 Firefox (Latest)

#### Test Case 9.2.1: Full Functionality Test
- **Test on**: Firefox 120+
- **Verify**:
  - All features work
  - Chart.js renders
  - Date pickers work
  - PWA installable
- **Expected**: Full compatibility

#### Test Case 9.2.2: Firefox-Specific Issues
- **Check**:
  - CSS Grid/Flexbox rendering
  - Form validation styling
  - Push notification API
- **Expected**: Consistent with Chrome

### 9.3 Safari (Latest)

#### Test Case 9.3.1: Desktop Safari Test
- **Test on**: Safari 17+
- **Verify**:
  - All features work
  - Date inputs work (Safari has different picker)
  - Charts render
  - Service worker support
- **Expected**: Full compatibility

#### Test Case 9.3.2: Safari-Specific Issues
- **Check**:
  - IndexedDB support
  - Push notifications (limited on Safari)
  - CSS features (backdrop-filter, etc.)
- **Expected**: Graceful degradation where needed

### 9.4 Edge (Latest)

#### Test Case 9.4.1: Full Functionality Test
- **Test on**: Edge 120+ (Chromium-based)
- **Verify**:
  - All features work
  - PWA installation
  - Similar to Chrome behavior
- **Expected**: Full compatibility

### 9.5 Mobile Safari (iOS)

#### Test Case 9.5.1: iOS Safari Test
- **Test on**: iOS 16+, Safari
- **Verify**:
  - Touch interactions
  - Viewport scaling
  - Add to Home Screen
  - Offline functionality
  - Date/time pickers (iOS native)
- **Expected**: Mobile-optimized experience

#### Test Case 9.5.2: iOS PWA Mode
- **Steps**:
  1. Add to Home Screen
  2. Open from home screen
  3. Test all features
- **Expected**: 
  - Standalone mode works
  - No Safari UI
  - Full functionality

### 9.6 Chrome Mobile (Android)

#### Test Case 9.6.1: Android Chrome Test
- **Test on**: Android 10+, Chrome
- **Verify**:
  - Touch interactions
  - PWA installation
  - Push notifications
  - Offline mode
- **Expected**: Full mobile functionality

#### Test Case 9.6.2: Android PWA Mode
- **Steps**:
  1. Install PWA
  2. Open from app drawer
  3. Test features
- **Expected**: Native-like experience

### 9.7 Browser Compatibility Issues

#### Test Case 9.7.1: Polyfills and Fallbacks
- **Verify**:
  - ES6+ features transpiled
  - CSS fallbacks for older browsers
  - Graceful degradation
- **Expected**: Works on supported browsers

#### Test Case 9.7.2: Console Errors
- **Steps**:
  1. Open console on each browser
  2. Navigate through app
  3. Check for errors
- **Expected**: No critical errors

---

## 10. Responsive Design Testing

### 10.1 Mobile (<640px)

#### Test Case 10.1.1: Portrait Mode (375x667 - iPhone SE)
- **Verify**:
  - All content visible
  - No horizontal scroll
  - Touch targets ≥44x44px
  - Forms usable
  - Navigation accessible
- **Expected**: Optimized mobile layout

#### Test Case 10.1.2: Portrait Mode (390x844 - iPhone 12/13)
- **Verify**:
  - Layout adapts
  - Content readable
  - Charts fit screen
- **Expected**: Proper mobile display

#### Test Case 10.1.3: Portrait Mode (360x640 - Android)
- **Verify**:
  - Similar to iPhone
  - Android-specific UI elements
- **Expected**: Consistent mobile experience

#### Test Case 10.1.4: Landscape Mode (667x375)
- **Verify**:
  - Layout adjusts
  - Navigation still accessible
  - Forms usable
  - Charts readable
- **Expected**: Landscape-optimized layout

### 10.2 Tablet (640px-1024px)

#### Test Case 10.2.1: Portrait Mode (768x1024 - iPad)
- **Verify**:
  - Utilizes extra space
  - Multi-column layouts where appropriate
  - Charts larger
  - Tables readable
- **Expected**: Tablet-optimized layout

#### Test Case 10.2.2: Landscape Mode (1024x768)
- **Verify**:
  - Desktop-like layout
  - Sidebar navigation (if applicable)
  - More data visible
- **Expected**: Enhanced tablet experience

### 10.3 Desktop (1024px-1400px)

#### Test Case 10.3.1: Standard Desktop (1280x720)
- **Verify**:
  - Full desktop layout
  - Sidebar visible
  - Tables with all columns
  - Charts full-sized
- **Expected**: Complete desktop experience

#### Test Case 10.3.2: Laptop (1366x768)
- **Verify**:
  - Similar to 1280x720
  - Proper spacing
  - No cramped UI
- **Expected**: Comfortable desktop layout

### 10.4 Large Desktop (≥1400px)

#### Test Case 10.4.1: Full HD (1920x1080)
- **Verify**:
  - Content centered or full-width
  - Table view for refills/expenses
  - Large charts
  - No excessive whitespace
- **Expected**: Optimized for large screens

#### Test Case 10.4.2: 4K (3840x2160)
- **Verify**:
  - Content scales appropriately
  - Text remains readable
  - Images sharp
  - Layout doesn't break
- **Expected**: Scales well to 4K

### 10.5 Breakpoint Testing

#### Test Case 10.5.1: Resize Window Dynamically
- **Steps**:
  1. Start at desktop size
  2. Slowly resize to mobile
  3. Observe layout changes
- **Expected**: 
  - Smooth transitions
  - No broken layouts
  - Content reflows properly

#### Test Case 10.5.2: Critical Breakpoints
- **Test at**:
  - 639px (mobile max)
  - 640px (tablet min)
  - 1023px (tablet max)
  - 1024px (desktop min)
  - 1399px (desktop max)
  - 1400px (large desktop min)
- **Expected**: Clean transitions at each breakpoint

### 10.6 Touch vs Mouse Interactions

#### Test Case 10.6.1: Touch Targets (Mobile)
- **Verify**:
  - All buttons ≥44x44px
  - Adequate spacing between targets
  - No accidental taps
- **Expected**: Touch-friendly interface

#### Test Case 10.6.2: Hover States (Desktop)
- **Verify**:
  - Hover effects on buttons
  - Hover tooltips
  - Cursor changes appropriately
- **Expected**: Enhanced desktop interactions

#### Test Case 10.6.3: Swipe Gestures (Mobile)
- **Test**:
  - Swipe to delete (if implemented)
  - Swipe navigation (if implemented)
  - Pull to refresh (if implemented)
- **Expected**: Intuitive mobile gestures

---

## 11. PWA Testing

### 11.1 Installation

#### Test Case 11.1.1: Install on Desktop (Chrome)
- **Steps**:
  1. Visit app in Chrome
  2. Click install icon in address bar
  3. Confirm installation
  4. Open installed app
- **Expected**: 
  - App installs successfully
  - Opens in standalone window
  - No browser UI

#### Test Case 11.1.2: Install on Mobile (iOS)
- **Steps**:
  1. Open in Safari
  2. Tap Share button
  3. Select "Add to Home Screen"
  4. Confirm
  5. Open from home screen
- **Expected**: 
  - Icon added to home screen
  - Opens in standalone mode
  - Splash screen shows

#### Test Case 11.1.3: Install on Mobile (Android)
- **Steps**:
  1. Open in Chrome
  2. Tap "Add to Home Screen" prompt
  3. Or use menu → "Install App"
  4. Confirm
  5. Open from app drawer
- **Expected**: 
  - App installed
  - Appears in app drawer
  - Standalone mode

### 11.2 App Manifest

#### Test Case 11.2.1: Manifest Validation
- **Verify manifest.json contains**:
  - name: "FuelSync"
  - short_name: "FuelSync"
  - description
  - start_url: "/"
  - display: "standalone"
  - theme_color
  - background_color
  - icons (all sizes)
- **Expected**: Valid manifest

#### Test Case 11.2.2: Icons Display
- **Verify icons**:
  - 192x192 (Android)
  - 512x512 (Android)
  - 180x180 (iOS)
  - Favicon sizes
- **Expected**: 
  - All icons present
  - Sharp and clear
  - Proper branding

#### Test Case 11.2.3: Splash Screen
- **Steps**:
  1. Open PWA from home screen
  2. Observe splash screen
- **Expected**: 
  - Branded splash screen
  - Smooth transition to app

### 11.3 Service Worker

#### Test Case 11.3.1: Service Worker Registration
- **Steps**:
  1. Open app
  2. Check DevTools → Application → Service Workers
- **Expected**: 
  - Service worker registered
  - Status: Activated
  - Scope: "/"

#### Test Case 11.3.2: Caching Strategy
- **Steps**:
  1. Load app online
  2. Check Network tab
  3. Verify cached resources
- **Expected**: 
  - Static assets cached
  - API responses cached (if applicable)
  - Cache-first strategy for assets

#### Test Case 11.3.3: Service Worker Update
- **Steps**:
  1. Deploy new version
  2. Reload app
  3. Observe update prompt
  4. Accept update
- **Expected**: 
  - New service worker detected
  - User prompted to update
  - App updates smoothly

### 11.4 Offline Functionality

#### Test Case 11.4.1: Load App Offline
- **Steps**:
  1. Load app online
  2. Turn off network
  3. Reload app
- **Expected**: 
  - App loads from cache
  - UI functional
  - Offline indicator shown

#### Test Case 11.4.2: Offline Data Access
- **Steps**:
  1. View refills/expenses offline
  2. Check cached data
- **Expected**: 
  - Previously loaded data visible
  - No new data fetched

#### Test Case 11.4.3: Offline Form Submission
- **Steps**:
  1. Go offline
  2. Try to add refill
  3. Submit form
- **Expected**: 
  - Error message shown
  - Or queued for sync when online

#### Test Case 11.4.4: Return Online
- **Steps**:
  1. Go offline
  2. Use app
  3. Go back online
  4. Refresh data
- **Expected**: 
  - Syncs with server
  - Updates data
  - Queued actions processed

### 11.5 Background Sync (if implemented)

#### Test Case 11.5.1: Queue Actions Offline
- **Steps**:
  1. Go offline
  2. Add refill
  3. Action queued
  4. Go online
- **Expected**: 
  - Action syncs automatically
  - User notified of success

#### Test Case 11.5.2: Sync Failure Handling
- **Steps**:
  1. Queue action offline
  2. Go online with API error
  3. Observe retry
- **Expected**: 
  - Retries sync
  - Eventually notifies user of failure

### 11.6 Push Notifications (PWA)

#### Test Case 11.6.1: Request Permission
- **Steps**:
  1. Enable notifications in settings
  2. Browser prompts for permission
  3. Grant permission
- **Expected**: 
  - Permission granted
  - Subscription created

#### Test Case 11.6.2: Receive Notification (App Closed)
- **Steps**:
  1. Close PWA
  2. Trigger notification from backend
  3. Observe notification
- **Expected**: 
  - Notification appears
  - Click opens app

#### Test Case 11.6.3: Receive Notification (App Open)
- **Steps**:
  1. Keep PWA open
  2. Trigger notification
- **Expected**: 
  - In-app notification or
  - System notification (depends on implementation)

---

## 12. Internationalization Testing

### 12.1 Language Switching

#### Test Case 12.1.1: Switch to Ukrainian
- **Steps**:
  1. Open language selector
  2. Select "Українська"
  3. Observe UI changes
- **Expected**: 
  - All text switches to Ukrainian
  - Layout adjusts if needed
  - Preference saved

#### Test Case 12.1.2: Switch to English
- **Steps**:
  1. From Ukrainian, switch to English
  2. Observe changes
- **Expected**: 
  - All text switches to English
  - Preference saved

#### Test Case 12.1.3: Language Persistence
- **Steps**:
  1. Select Ukrainian
  2. Logout
  3. Login again
- **Expected**: Ukrainian still selected

### 12.2 Translation Coverage

#### Test Case 12.2.1: Navigation and Menus
- **Verify translated**:
  - Dashboard
  - Vehicles
  - Refills
  - Expenses
  - Reminders
  - Analytics
  - Settings
- **Expected**: All menu items translated

#### Test Case 12.2.2: Forms and Labels
- **Verify translated**:
  - Form field labels
  - Placeholders
  - Button text
  - Validation messages
  - Help text
- **Expected**: Complete form translations

#### Test Case 12.2.3: Messages and Notifications
- **Verify translated**:
  - Success messages
  - Error messages
  - Confirmation dialogs
  - Empty states
  - Loading states
- **Expected**: All messages translated

#### Test Case 12.2.4: Charts and Analytics
- **Verify translated**:
  - Chart titles
  - Axis labels
  - Legend items
  - Stat card labels
- **Expected**: Analytics fully translated

#### Test Case 12.2.5: Missing Translation Keys
- **Steps**:
  1. Switch languages
  2. Navigate entire app
  3. Look for untranslated text or translation keys (e.g., "common.save")
- **Expected**: No missing translations

### 12.3 Date and Number Formatting

#### Test Case 12.3.1: Date Format (English)
- **Verify**:
  - Format: MM/DD/YYYY or DD/MM/YYYY
  - Consistent throughout app
  - No time shown (per requirements)
- **Expected**: Proper English date format

#### Test Case 12.3.2: Date Format (Ukrainian)
- **Verify**:
  - Format: DD.MM.YYYY (European style)
  - Consistent throughout app
- **Expected**: Proper Ukrainian date format

#### Test Case 12.3.3: Number Format (English)
- **Verify**:
  - Decimal separator: `.` (dot)
  - Thousands separator: `,` (comma)
  - Example: `1,234.56`
- **Expected**: English number format

#### Test Case 12.3.4: Number Format (Ukrainian)
- **Verify**:
  - Decimal separator: `,` (comma) or `.` (dot)
  - Thousands separator: ` ` (space) or `.`
  - Example: `1 234,56` or `1.234,56`
- **Expected**: Ukrainian number format

#### Test Case 12.3.5: Currency Format
- **Verify**:
  - USD: `$1,234.56` (English) or `1 234,56 $` (Ukrainian)
  - UAH: `₴1,234` (English) or `1 234 ₴` (Ukrainian)
- **Expected**: Proper currency formatting per locale

### 12.4 Text Direction and Layout

#### Test Case 12.4.1: LTR Layout (English/Ukrainian)
- **Verify**:
  - Text flows left-to-right
  - Icons positioned correctly
  - Forms aligned properly
- **Expected**: Proper LTR layout

#### Test Case 12.4.2: Text Overflow
- **Steps**:
  1. Switch to Ukrainian (often longer words)
  2. Check for text overflow
  3. Verify buttons, labels fit
- **Expected**: 
  - No text cutoff
  - Proper wrapping
  - Responsive containers

### 12.5 Locale-Specific Features

#### Test Case 12.5.1: First Day of Week
- **Verify**:
  - English: Sunday
  - Ukrainian: Monday
- **Expected**: Calendar/date pickers respect locale

#### Test Case 12.5.2: Time Format
- **Verify**:
  - English: 12-hour (AM/PM)
  - Ukrainian: 24-hour
- **Expected**: Proper time format (if time shown)

---

## 13. Performance Testing

### 13.1 Page Load Performance

#### Test Case 13.1.1: Initial Page Load
- **Metrics to measure**:
  - First Contentful Paint (FCP): <1.8s
  - Largest Contentful Paint (LCP): <2.5s
  - Time to Interactive (TTI): <3.8s
  - Total Blocking Time (TBT): <200ms
  - Cumulative Layout Shift (CLS): <0.1
- **Expected**: All metrics in "Good" range

#### Test Case 13.1.2: Lighthouse Score
- **Steps**:
  1. Run Lighthouse audit
  2. Check scores:
     - Performance: >90
     - Accessibility: >90
     - Best Practices: >90
     - SEO: >90
     - PWA: 100
- **Expected**: All scores >90

#### Test Case 13.1.3: Bundle Size
- **Verify**:
  - Main JS bundle: <500KB (gzipped)
  - CSS bundle: <100KB (gzipped)
  - Total page weight: <2MB
- **Expected**: Optimized bundle sizes

### 13.2 Runtime Performance

#### Test Case 13.2.1: Smooth Scrolling
- **Steps**:
  1. Load page with 100+ entries
  2. Scroll rapidly
  3. Monitor frame rate
- **Expected**: 
  - 60 FPS maintained
  - No jank or lag

#### Test Case 13.2.2: Chart Rendering
- **Steps**:
  1. Load analytics with large dataset
  2. Measure chart render time
  3. Interact with charts
- **Expected**: 
  - Charts render <1s
  - Smooth interactions

#### Test Case 13.2.3: Form Submission
- **Steps**:
  1. Fill out form
  2. Submit
  3. Measure response time
- **Expected**: 
  - Optimistic update immediate
  - API response <500ms

#### Test Case 13.2.4: Infinite Scroll Performance
- **Steps**:
  1. Scroll through 500+ entries
  2. Monitor memory usage
  3. Check for memory leaks
- **Expected**: 
  - Efficient virtualization
  - Stable memory usage

### 13.3 API Performance

#### Test Case 13.3.1: API Response Times
- **Measure**:
  - GET /vehicles: <200ms
  - GET /refills: <300ms
  - POST /refills: <400ms
  - GET /statistics: <500ms
  - GET /charts: <500ms
- **Expected**: All under target times

#### Test Case 13.3.2: Concurrent Requests
- **Steps**:
  1. Load dashboard (multiple API calls)
  2. Measure total load time
  3. Check for request waterfall
- **Expected**: 
  - Parallel requests
  - Total time <2s

#### Test Case 13.3.3: Large Dataset Queries
- **Steps**:
  1. Query vehicle with 1000+ refills
  2. Measure response time
  3. Check pagination
- **Expected**: 
  - Paginated results
  - Response <500ms per page

### 13.4 Caching and Optimization

#### Test Case 13.4.1: CloudFront Caching
- **Steps**:
  1. Load static assets
  2. Check response headers
  3. Verify cache hit/miss
- **Expected**: 
  - Static assets cached
  - Cache-Control headers set
  - High cache hit ratio

#### Test Case 13.4.2: Browser Caching
- **Steps**:
  1. Load app
  2. Reload page
  3. Check Network tab
- **Expected**: 
  - Assets loaded from cache
  - Faster subsequent loads

#### Test Case 13.4.3: TanStack Query Caching
- **Steps**:
  1. Load data
  2. Navigate away
  3. Navigate back
- **Expected**: 
  - Data loaded from cache
  - No unnecessary API calls

### 13.5 Large Dataset Handling

#### Test Case 13.5.1: 100+ Refills
- **Steps**:
  1. Load vehicle with 100+ refills
  2. Test all operations
  3. Monitor performance
- **Expected**: 
  - Smooth performance
  - Efficient rendering

#### Test Case 13.5.2: 500+ Expenses
- **Steps**:
  1. Load vehicle with 500+ expenses
  2. Test filtering, sorting
  3. Monitor memory
- **Expected**: 
  - Virtualized list
  - Stable performance

#### Test Case 13.5.3: Multiple Vehicles with Data
- **Steps**:
  1. Account with 5+ vehicles
  2. Each with 100+ entries
  3. Switch between vehicles
- **Expected**: 
  - Fast switching
  - Efficient data loading

---

## 14. Security Testing

### 14.1 Authentication Security

#### Test Case 14.1.1: JWT Token Security
- **Verify**:
  - Token stored securely (httpOnly cookie or secure storage)
  - Token includes expiration (15 min)
  - Token signed with secret
  - Token validated on every request
- **Expected**: Secure token handling

#### Test Case 14.1.2: Token Tampering
- **Steps**:
  1. Get valid JWT token
  2. Modify payload
  3. Attempt API call
- **Expected**: 401 Unauthorized

#### Test Case 14.1.3: Expired Token Handling
- **Steps**:
  1. Wait for token expiration
  2. Attempt API call
- **Expected**: 
  - 401 Unauthorized
  - Auto-redirect to login

#### Test Case 14.1.4: Password Security
- **Verify**:
  - Passwords hashed (Cognito handles this)
  - Min 8 characters enforced
  - Complexity requirements enforced
  - No password in logs/errors
- **Expected**: Secure password handling

### 14.2 Authorization Testing

#### Test Case 14.2.1: Access Own Data Only
- **Steps**:
  1. User A creates vehicle
  2. User B attempts to access User A's vehicle
- **Expected**: 403 Forbidden or 404 Not Found

#### Test Case 14.2.2: Modify Own Data Only
- **Steps**:
  1. User A creates refill
  2. User B attempts to edit User A's refill
- **Expected**: 403 Forbidden

#### Test Case 14.2.3: Delete Own Data Only
- **Steps**:
  1. User A creates expense
  2. User B attempts to delete User A's expense
- **Expected**: 403 Forbidden

### 14.3 Input Validation

#### Test Case 14.3.1: SQL Injection (DynamoDB)
- **Test with**:
  - `'; DROP TABLE vehicles; --`
  - `1' OR '1'='1`
- **Expected**: 
  - Treated as literal strings
  - No code execution

#### Test Case 14.3.2: XSS Prevention
- **Test with**:
  - `<script>alert('XSS')</script>`
  - `<img src=x onerror=alert('XSS')>`
- **Expected**: 
  - Sanitized on input
  - Escaped on output
  - No script execution

#### Test Case 14.3.3: Command Injection
- **Test with**:
  - `; ls -la`
  - `| cat /etc/passwd`
- **Expected**: 
  - Treated as literal strings
  - No command execution

#### Test Case 14.3.4: Path Traversal
- **Test with**:
  - `../../etc/passwd`
  - `..\\..\\windows\\system32`
- **Expected**: 
  - Invalid path rejected
  - No file access

### 14.4 API Security

#### Test Case 14.4.1: HTTPS Enforcement
- **Steps**:
  1. Attempt HTTP request
  2. Verify redirect to HTTPS
- **Expected**: All traffic over HTTPS (TLS 1.3)

#### Test Case 14.4.2: CORS Configuration
- **Steps**:
  1. Make request from unauthorized origin
  2. Check CORS headers
- **Expected**: 
  - Only allowed origins accepted
  - Proper CORS headers

#### Test Case 14.4.3: Rate Limiting
- **Steps**:
  1. Make 100 requests rapidly
  2. Check for rate limit
- **Expected**: 
  - Rate limit enforced
  - 429 Too Many Requests

#### Test Case 14.4.4: API Key/Token in URL
- **Verify**:
  - No tokens in query params
  - Tokens in Authorization header
  - No sensitive data in URLs
- **Expected**: Secure token transmission

### 14.5 Data Security

#### Test Case 14.5.1: Encryption at Rest
- **Verify**:
  - DynamoDB encryption enabled
  - S3 encryption enabled
  - Cognito data encrypted
- **Expected**: All data encrypted at rest

#### Test Case 14.5.2: Encryption in Transit
- **Verify**:
  - TLS 1.3 used
  - Strong cipher suites
  - Valid SSL certificate
- **Expected**: All data encrypted in transit

#### Test Case 14.5.3: Sensitive Data Exposure
- **Check**:
  - No passwords in responses
  - No tokens in logs
  - No PII in error messages
- **Expected**: No sensitive data leaked

### 14.6 AWS Security

#### Test Case 14.6.1: IAM Least Privilege
- **Verify**:
  - Lambda has minimal permissions
  - API Gateway has minimal permissions
  - No overly permissive policies
- **Expected**: Least privilege principle applied

#### Test Case 14.6.2: S3 Bucket Security
- **Verify**:
  - Bucket not publicly accessible
  - Encryption enabled
  - Versioning enabled (if applicable)
  - Access logging enabled
- **Expected**: Secure S3 configuration

#### Test Case 14.6.3: CloudFront Security
- **Verify**:
  - HTTPS only
  - Origin access identity configured
  - Security headers set
- **Expected**: Secure CloudFront setup

---

## 15. Data Integrity Testing

### 15.1 Numeric Precision

#### Test Case 15.1.1: Two Decimal Places
- **Test with**:
  - Amount: `50.123` → Should store/display as `50.12`
  - Amount: `50.1` → Should display as `50.10`
  - Amount: `50` → Should display as `50.00`
- **Expected**: Always 2 decimal places

#### Test Case 15.1.2: Dot Separator
- **Verify**:
  - Input accepts dot: `50.25`
  - Display shows dot: `$50.25`
  - No comma as decimal separator in USD
- **Expected**: Consistent dot separator

#### Test Case 15.1.3: Large Numbers
- **Test with**:
  - `999999.99`
  - `1000000.00`
- **Expected**: 
  - Stored accurately
  - Displayed with thousands separator
  - No precision loss

#### Test Case 15.1.4: Rounding
- **Test with**:
  - `50.125` → `50.13` (round up)
  - `50.124` → `50.12` (round down)
- **Expected**: Proper rounding to 2 decimals

### 15.2 Currency Conversion

#### Test Case 15.2.1: Fixed Exchange Rate
- **Verify**:
  - 1 USD = 40 UAH (hardcoded)
  - Conversion accurate
  - Rate stored with entry
- **Expected**: Consistent conversion

#### Test Case 15.2.2: Base Amount Calculation
- **Test**:
  - UAH 4000 → Base: $100.00
  - UAH 1500 → Base: $37.50
  - USD 50 → Base: $50.00
- **Expected**: Accurate base amounts

#### Test Case 15.2.3: Analytics Aggregation
- **Steps**:
  1. Add refills in USD and UAH
  2. View total fuel cost
  3. Verify sum uses base amounts
- **Expected**: 
  - All converted to USD
  - Accurate total

### 15.3 Odometer Sequence

#### Test Case 15.3.1: Increasing Odometer
- **Setup**:
  - Refill A: 50000 km
  - Refill B: 50250 km
  - Refill C: 50500 km
- **Expected**: Sequence maintained

#### Test Case 15.3.2: Prevent Decreasing Odometer
- **Steps**:
  1. Last odometer: 50500
  2. Try to add refill with 50400
- **Expected**: Validation error

#### Test Case 15.3.3: Edit Middle Entry
- **Setup**:
  - A: 50000, B: 50250, C: 50500
- **Steps**:
  1. Edit B to 50300
- **Expected**: 
  - Allowed (still between A and C)
  - Efficiency recalculated

#### Test Case 15.3.4: Edit Breaks Sequence
- **Setup**:
  - A: 50000, B: 50250, C: 50500
- **Steps**:
  1. Edit B to 50600 (higher than C)
- **Expected**: Validation error

### 15.4 Fuel Efficiency Calculations

#### Test Case 15.4.1: Basic Efficiency
- **Setup**:
  - Refill A: Odo 50000, Vol 45L, Full
  - Refill B: Odo 50450, Vol 50L, Full
- **Calculate**:
  - Distance: 450 km
  - Efficiency: 450 / 50 = 9.0 km/L
  - Or: 50 / 450 * 100 = 11.11 L/100km
- **Expected**: Matches calculation

#### Test Case 15.4.2: Running Average
- **Setup**:
  - Last 10 refills with varying efficiency
- **Calculate**:
  - Average of last 10
- **Expected**: Accurate average

#### Test Case 15.4.3: Partial Fill Handling
- **Setup**:
  - Mix of full and partial fills
- **Expected**: 
  - Running average method used
  - Reasonable efficiency calculated

#### Test Case 15.4.4: City/Highway Efficiency
- **Setup**:
  - 5 city refills
  - 5 highway refills
- **Expected**: 
  - Separate efficiency for each
  - Highway typically better than city

### 15.5 Date and Timestamp Consistency

#### Test Case 15.5.1: Date Storage
- **Verify**:
  - Dates stored in ISO 8601 format
  - Timezone handled correctly
  - No time component (per requirements)
- **Expected**: Consistent date storage

#### Test Case 15.5.2: Date Display
- **Verify**:
  - No time shown (no ", 00:00:00")
  - Format matches locale
  - Consistent across app
- **Expected**: Clean date display

#### Test Case 15.5.3: Timestamp for Sorting
- **Verify**:
  - Entries sorted by date correctly
  - Same-day entries sorted by creation time
- **Expected**: Proper chronological order

### 15.6 Concurrent Updates

#### Test Case 15.6.1: Simultaneous Edits
- **Steps**:
  1. Open entry in two tabs
  2. Edit in Tab 1, save
  3. Edit in Tab 2, save
- **Expected**: 
  - Last write wins, or
  - Conflict detection

#### Test Case 15.6.2: Optimistic Update Conflicts
- **Steps**:
  1. Add entry (optimistic update)
  2. API fails
  3. Verify rollback
- **Expected**: 
  - Entry removed from UI
  - Error shown
  - Data consistent

---

## 16. Error Handling Testing

### 16.1 Network Errors

#### Test Case 16.1.1: No Internet Connection
- **Steps**:
  1. Disconnect internet
  2. Try to load data
- **Expected**: 
  - "No internet connection" message
  - Cached data shown (if available)
  - Retry option

#### Test Case 16.1.2: Slow Network
- **Steps**:
  1. Throttle network to 3G
  2. Load app
  3. Perform actions
- **Expected**: 
  - Loading indicators shown
  - Timeout after reasonable period
  - Graceful degradation

#### Test Case 16.1.3: Intermittent Connection
- **Steps**:
  1. Toggle network on/off
  2. Perform actions
- **Expected**: 
  - Handles connection drops
  - Retries failed requests
  - User notified

### 16.2 API Errors

#### Test Case 16.2.1: 400 Bad Request
- **Steps**:
  1. Submit invalid data
  2. Receive 400 error
- **Expected**: 
  - User-friendly error message
  - Specific field errors shown
  - Form not cleared

#### Test Case 16.2.2: 401 Unauthorized
- **Steps**:
  1. Token expires
  2. Make API call
- **Expected**: 
  - Auto-redirect to login
  - Session cleared
  - Message: "Session expired"

#### Test Case 16.2.3: 403 Forbidden
- **Steps**:
  1. Attempt unauthorized action
  2. Receive 403
- **Expected**: 
  - "Access denied" message
  - No data exposed

#### Test Case 16.2.4: 404 Not Found
- **Steps**:
  1. Request non-existent resource
  2. Receive 404
- **Expected**: 
  - "Resource not found" message
  - Redirect to appropriate page

#### Test Case 16.2.5: 500 Internal Server Error
- **Steps**:
  1. Trigger server error
  2. Receive 500
- **Expected**: 
  - "Something went wrong" message
  - Error logged
  - Retry option

#### Test Case 16.2.6: 503 Service Unavailable
- **Steps**:
  1. Service temporarily down
  2. Receive 503
- **Expected**: 
  - "Service temporarily unavailable" message
  - Retry after delay

### 16.3 Form Validation Errors

#### Test Case 16.3.1: Required Field Missing
- **Steps**:
  1. Submit form with empty required field
- **Expected**: 
  - Field highlighted
  - Error message: "This field is required"
  - Focus on field

#### Test Case 16.3.2: Invalid Format
- **Steps**:
  1. Enter invalid email, date, number
  2. Submit
- **Expected**: 
  - Format-specific error
  - Example shown
  - Field highlighted

#### Test Case 16.3.3: Multiple Validation Errors
- **Steps**:
  1. Submit form with multiple errors
- **Expected**: 
  - All errors shown
  - Fields highlighted
  - Summary at top (optional)

### 16.4 User-Friendly Error Messages

#### Test Case 16.4.1: Technical vs User Messages
- **Verify**:
  - No stack traces shown to user
  - No technical jargon
  - Clear, actionable messages
- **Expected**: User-friendly errors

#### Test Case 16.4.2: Error Message Localization
- **Steps**:
  1. Switch to Ukrainian
  2. Trigger errors
- **Expected**: Errors in Ukrainian

#### Test Case 16.4.3: Error Recovery Guidance
- **Verify messages include**:
  - What went wrong
  - Why it happened (if helpful)
  - How to fix it
  - Retry/cancel options
- **Expected**: Helpful error messages

### 16.5 Timeout Handling

#### Test Case 16.5.1: API Request Timeout
- **Steps**:
  1. Simulate slow API (30s+)
  2. Wait for timeout
- **Expected**: 
  - Request cancelled after timeout
  - "Request timed out" message
  - Retry option

#### Test Case 16.5.2: Loading State Timeout
- **Steps**:
  1. Trigger long-running operation
  2. Observe loading indicator
- **Expected**: 
  - Loading shown
  - Timeout after reasonable period
  - User can cancel

### 16.6 Edge Case Errors

#### Test Case 16.6.1: Empty Response
- **Steps**:
  1. API returns empty response
  2. Handle gracefully
- **Expected**: 
  - Empty state shown
  - No crash

#### Test Case 16.6.2: Malformed Response
- **Steps**:
  1. API returns invalid JSON
  2. Handle error
- **Expected**: 
  - Parse error caught
  - Generic error message
  - Logged for debugging

#### Test Case 16.6.3: Unexpected Data Type
- **Steps**:
  1. API returns string instead of number
  2. Handle gracefully
- **Expected**: 
  - Type validation
  - Error or default value
  - No crash

---

## 17. Accessibility Testing

### 17.1 Keyboard Navigation

#### Test Case 17.1.1: Tab Order
- **Steps**:
  1. Use Tab key to navigate
  2. Verify logical order
  3. Check all interactive elements reachable
- **Expected**: 
  - Logical tab order
  - No keyboard traps
  - All elements accessible

#### Test Case 17.1.2: Focus Indicators
- **Steps**:
  1. Tab through page
  2. Verify focus visible on each element
- **Expected**: 
  - Clear focus outline
  - High contrast
  - Visible on all elements

#### Test Case 17.1.3: Keyboard Shortcuts
- **Test**:
  - Enter to submit forms
  - Escape to close modals
  - Arrow keys in dropdowns
  - Space to toggle checkboxes
- **Expected**: Standard keyboard interactions work

#### Test Case 17.1.4: Skip Navigation
- **Steps**:
  1. Tab from top of page
  2. Look for "Skip to main content" link
  3. Activate link
- **Expected**: 
  - Skip link visible on focus
  - Jumps to main content

### 17.2 Screen Reader Compatibility

#### Test Case 17.2.1: NVDA (Windows)
- **Steps**:
  1. Enable NVDA
  2. Navigate through app
  3. Verify all content announced
- **Expected**: 
  - All text read
  - Form labels announced
  - Button purposes clear

#### Test Case 17.2.2: JAWS (Windows)
- **Steps**:
  1. Enable JAWS
  2. Navigate app
  3. Test forms and interactions
- **Expected**: Full compatibility

#### Test Case 17.2.3: VoiceOver (macOS/iOS)
- **Steps**:
  1. Enable VoiceOver
  2. Navigate app
  3. Test on both desktop and mobile
- **Expected**: 
  - All content accessible
  - Gestures work on mobile

#### Test Case 17.2.4: TalkBack (Android)
- **Steps**:
  1. Enable TalkBack
  2. Navigate app
  3. Test touch interactions
- **Expected**: Full mobile accessibility

### 17.3 ARIA Labels and Roles

#### Test Case 17.3.1: Form Labels
- **Verify**:
  - All inputs have labels
  - Labels associated with inputs
  - Placeholder not used as label
- **Expected**: Proper form labeling

#### Test Case 17.3.2: Button Labels
- **Verify**:
  - All buttons have text or aria-label
  - Icon-only buttons have aria-label
  - Purpose clear from label
- **Expected**: All buttons labeled

#### Test Case 17.3.3: ARIA Roles
- **Verify**:
  - Navigation: role="navigation"
  - Main content: role="main"
  - Alerts: role="alert"
  - Dialogs: role="dialog"
- **Expected**: Semantic ARIA roles

#### Test Case 17.3.4: ARIA States
- **Verify**:
  - aria-expanded on dropdowns
  - aria-checked on checkboxes
  - aria-disabled on disabled elements
  - aria-invalid on error fields
- **Expected**: Proper ARIA states

### 17.4 Color Contrast

#### Test Case 17.4.1: Text Contrast (WCAG AA)
- **Verify**:
  - Normal text: ≥4.5:1
  - Large text (18pt+): ≥3:1
  - UI components: ≥3:1
- **Expected**: All text meets contrast ratio

#### Test Case 17.4.2: Dark Theme Contrast
- **Steps**:
  1. Enable dark theme
  2. Check all text contrast
- **Expected**: Maintains contrast ratios

#### Test Case 17.4.3: Color Blindness
- **Test with**:
  - Protanopia (red-blind)
  - Deuteranopia (green-blind)
  - Tritanopia (blue-blind)
- **Expected**: 
  - Information not conveyed by color alone
  - Patterns/icons supplement color

#### Test Case 17.4.4: Contrast Checker Tools
- **Use**:
  - Chrome DevTools Lighthouse
  - axe DevTools
  - WAVE browser extension
- **Expected**: No contrast issues reported

### 17.5 Alternative Text

#### Test Case 17.5.1: Image Alt Text
- **Verify**:
  - All images have alt attribute
  - Alt text descriptive
  - Decorative images: alt=""
- **Expected**: Proper alt text

#### Test Case 17.5.2: Icon Accessibility
- **Verify**:
  - Icon-only buttons have aria-label
  - Decorative icons hidden from screen readers
  - Meaningful icons have text alternative
- **Expected**: Icons accessible

### 17.6 Form Accessibility

#### Test Case 17.6.1: Error Identification
- **Steps**:
  1. Submit form with errors
  2. Verify errors announced
  3. Check error association with fields
- **Expected**: 
  - Errors announced by screen reader
  - aria-describedby links error to field
  - Error summary at top (optional)

#### Test Case 17.6.2: Required Fields
- **Verify**:
  - Required fields marked visually
  - aria-required="true" on required fields
  - Asterisk not sole indicator
- **Expected**: Clear required field indication

#### Test Case 17.6.3: Input Instructions
- **Verify**:
  - Format instructions provided
  - Instructions associated with field
  - Help text accessible
- **Expected**: Clear input guidance

### 17.7 Responsive Accessibility

#### Test Case 17.7.1: Mobile Touch Targets
- **Verify**:
  - All targets ≥44x44px
  - Adequate spacing between targets
  - No accidental activations
- **Expected**: Touch-friendly interface

#### Test Case 17.7.2: Zoom and Reflow
- **Steps**:
  1. Zoom to 200%
  2. Verify content reflows
  3. No horizontal scroll
- **Expected**: 
  - Content readable at 200% zoom
  - No loss of functionality

---

## 18. Edge Cases Testing

### 18.1 Empty States

#### Test Case 18.1.1: No Vehicles
- **Steps**:
  1. Login to new account
  2. View dashboard
- **Expected**: 
  - "No vehicles yet" message
  - Prominent "Add Vehicle" button
  - Helpful onboarding text

#### Test Case 18.1.2: No Refills
- **Steps**:
  1. Create vehicle
  2. View refills page
- **Expected**: 
  - "No refills yet" message
  - "Add Refill" CTA
  - Maybe quick start guide

#### Test Case 18.1.3: No Expenses
- **Steps**:
  1. View expenses for new vehicle
- **Expected**: Empty state with CTA

#### Test Case 18.1.4: No Reminders
- **Steps**:
  1. View reminders page
- **Expected**: Empty state with explanation

#### Test Case 18.1.5: No Analytics Data
- **Steps**:
  1. View analytics with no data
- **Expected**: 
  - Message: "Add refills to see analytics"
  - Empty charts or placeholders

### 18.2 Single Entry Scenarios

#### Test Case 18.2.1: Single Refill
- **Steps**:
  1. Add only one refill
  2. View analytics
- **Expected**: 
  - No efficiency calculated (need 2+ for comparison)
  - Other stats shown
  - Message: "Add more refills for efficiency"

#### Test Case 18.2.2: Single Expense
- **Steps**:
  1. Add one expense
  2. View analytics
- **Expected**: 
  - Total shown
  - No trends (need multiple for trend)

### 18.3 Maximum Values

#### Test Case 18.3.1: Very High Odometer
- **Test with**:
  - `999999` km
  - `1000000` km
- **Expected**: 
  - Accepted and stored
  - Displayed correctly
  - No overflow

#### Test Case 18.3.2: Very High Cost
- **Test with**:
  - `$99999.99`
  - `₴9999999`
- **Expected**: 
  - Accepted
  - Formatted with commas
  - Calculations accurate

#### Test Case 18.3.3: Very Large Volume
- **Test with**:
  - `999.99` liters
- **Expected**: Accepted (large tank or bulk purchase)

### 18.4 Minimum Values

#### Test Case 18.4.1: Zero Values
- **Test**:
  - Volume: `0` (should be rejected)
  - Price: `0` (free fuel - should be allowed)
  - Amount: `0` (should be allowed)
- **Expected**: Appropriate validation

#### Test Case 18.4.2: Very Small Values
- **Test**:
  - Volume: `0.01` liters
  - Price: `0.01` per liter
- **Expected**: 
  - Accepted
  - Calculations accurate
  - No precision loss

#### Test Case 18.4.3: Negative Values
- **Test**:
  - Volume: `-10`
  - Price: `-5.50`
  - Odometer: `-1000`
- **Expected**: All rejected with validation errors

### 18.5 Special Characters

#### Test Case 18.5.1: Special Chars in Text Fields
- **Test with**:
  - Vehicle make: `Aston-Martin`
  - Description: `Oil change @ Joe's Garage`
  - Notes: `Cost includes tax & labor`
- **Expected**: 
  - Accepted
  - Stored correctly
  - Displayed properly

#### Test Case 18.5.2: Unicode Characters
- **Test with**:
  - Ukrainian text: `Заправка`
  - Emoji: `🚗⛽`
  - Special symbols: `€£¥`
- **Expected**: 
  - Stored correctly
  - Displayed properly

#### Test Case 18.5.3: HTML/Script in Input
- **Test with**:
  - `<b>Bold</b>`
  - `<script>alert('test')</script>`
- **Expected**: 
  - Sanitized
  - Displayed as text, not executed

### 18.6 Very Long Text

#### Test Case 18.6.1: Long Vehicle Name
- **Test with**:
  - Make: 50 characters
  - Model: 100 characters
- **Expected**: 
  - Accepted or truncated
  - UI doesn't break

#### Test Case 18.6.2: Long Description
- **Test with**:
  - Description: 500 characters
  - Description: 1000 characters
- **Expected**: 
  - Accepted
  - Scrollable or truncated in list
  - Full text in detail view

### 18.7 Rapid Actions

#### Test Case 18.7.1: Rapid Form Submissions
- **Steps**:
  1. Fill form
  2. Click submit multiple times rapidly
- **Expected**: 
  - Only one submission processed
  - Button disabled after first click
  - No duplicate entries

#### Test Case 18.7.2: Rapid Navigation
- **Steps**:
  1. Click navigation links rapidly
  2. Switch pages quickly
- **Expected**: 
  - No race conditions
  - Correct page loads
  - No errors

#### Test Case 18.7.3: Rapid CRUD Operations
- **Steps**:
  1. Add, edit, delete entries rapidly
  2. Monitor data consistency
- **Expected**: 
  - All operations complete
  - Data consistent
  - No lost updates

### 18.8 Browser Back/Forward

#### Test Case 18.8.1: Back Button After Form Submit
- **Steps**:
  1. Submit form
  2. Navigate to next page
  3. Click browser back
- **Expected**: 
  - Returns to previous page
  - Form cleared or shows success message
  - No resubmission

#### Test Case 18.8.2: Forward Button
- **Steps**:
  1. Navigate back
  2. Click forward
- **Expected**: 
  - Returns to next page
  - State preserved

#### Test Case 18.8.3: Deep Linking
- **Steps**:
  1. Copy URL of specific page
  2. Paste in new tab
  3. Navigate to that page
- **Expected**: 
  - Page loads correctly
  - Auth checked
  - Data loaded

---

## 19. Integration Testing

### 19.1 API Gateway → Lambda → DynamoDB

#### Test Case 19.1.1: Complete Request Flow
- **Steps**:
  1. Make API request
  2. Trace through API Gateway
  3. Lambda execution
  4. DynamoDB query
  5. Response back to client
- **Expected**: 
  - Request flows correctly
  - Proper error handling at each stage
  - Response time acceptable

#### Test Case 19.1.2: Error Propagation
- **Steps**:
  1. Trigger DynamoDB error
  2. Verify Lambda catches it
  3. Verify API Gateway returns proper status
  4. Verify client handles error
- **Expected**: Errors handled at each layer

### 19.2 Cognito Authentication Flow

#### Test Case 19.2.1: Sign Up → Verify → Login
- **Steps**:
  1. Sign up new user
  2. Verify email
  3. Login
  4. Access protected resources
- **Expected**: Complete auth flow works

#### Test Case 19.2.2: Token Refresh Flow
- **Steps**:
  1. Login
  2. Wait for token near expiration
  3. Make API call
  4. Verify token refreshed
- **Expected**: Seamless token refresh

### 19.3 EventBridge → Lambda → SES

#### Test Case 19.3.1: Scheduled Reminder Check
- **Steps**:
  1. Create reminder due tomorrow
  2. Wait for scheduled check (or trigger manually)
  3. Verify Lambda executes
  4. Verify email sent via SES
- **Expected**: 
  - EventBridge triggers Lambda
  - Lambda queries reminders
  - SES sends email
  - User receives email

#### Test Case 19.3.2: Push Notification Flow
- **Steps**:
  1. Subscribe to push
  2. Trigger reminder
  3. Lambda sends push notification
- **Expected**: 
  - Push notification received
  - Click opens app

### 19.4 S3 → CloudFront

#### Test Case 19.4.1: Static Asset Delivery
- **Steps**:
  1. Deploy app to S3
  2. Access via CloudFront URL
  3. Verify assets load
- **Expected**: 
  - All assets served via CloudFront
  - Proper caching headers
  - Fast delivery

#### Test Case 19.4.2: Cache Invalidation
- **Steps**:
  1. Deploy new version
  2. Invalidate CloudFront cache
  3. Verify new version served
- **Expected**: 
  - Cache invalidated
  - New version loads
  - No stale content

### 19.5 TanStack Query Caching

#### Test Case 19.5.1: Query Caching
- **Steps**:
  1. Load data
  2. Navigate away
  3. Navigate back
  4. Verify data from cache
- **Expected**: 
  - Data loaded from cache
  - No API call
  - Instant display

#### Test Case 19.5.2: Cache Invalidation
- **Steps**:
  1. Load data
  2. Modify data
  3. Verify cache invalidated
  4. Fresh data loaded
- **Expected**: 
  - Cache invalidated on mutation
  - Fresh data fetched

### 19.6 Zustand State Management

#### Test Case 19.6.1: Global State Updates
- **Steps**:
  1. Update vehicle selection
  2. Verify state updated
  3. Verify all components reflect change
- **Expected**: 
  - State updated globally
  - All components in sync

#### Test Case 19.6.2: State Persistence
- **Steps**:
  1. Update state
  2. Refresh page
  3. Verify state persisted (if applicable)
- **Expected**: Important state persisted

---

## 20. Load Testing

### 20.1 Concurrent Users

#### Test Case 20.1.1: 10 Concurrent Users
- **Setup**:
  - Simulate 10 users
  - Each performing typical actions
- **Measure**:
  - Response times
  - Error rate
  - System resources
- **Expected**: 
  - All requests successful
  - Response times acceptable

#### Test Case 20.1.2: 50 Concurrent Users
- **Setup**:
  - Simulate 50 users
  - Mix of read/write operations
- **Expected**: 
  - System handles load
  - No significant degradation

#### Test Case 20.1.3: 100 Concurrent Users
- **Setup**:
  - Simulate 100 users
  - Stress test
- **Expected**: 
  - System remains stable
  - Or graceful degradation

### 20.2 API Rate Limits

#### Test Case 20.2.1: Burst Requests
- **Steps**:
  1. Send 100 requests in 1 second
  2. Observe rate limiting
- **Expected**: 
  - Rate limit enforced
  - 429 responses
  - Retry-After header

#### Test Case 20.2.2: Sustained Load
- **Steps**:
  1. Send steady stream of requests
  2. Monitor over 5 minutes
- **Expected**: 
  - Consistent performance
  - No throttling under normal load

### 20.3 DynamoDB Performance

#### Test Case 20.3.1: Read Capacity
- **Steps**:
  1. Perform many read operations
  2. Monitor DynamoDB metrics
- **Expected**: 
  - No throttling
  - Consistent read times

#### Test Case 20.3.2: Write Capacity
- **Steps**:
  1. Perform many write operations
  2. Monitor metrics
- **Expected**: 
  - No throttling
  - Consistent write times

### 20.4 Lambda Cold Starts

#### Test Case 20.4.1: Measure Cold Start Time
- **Steps**:
  1. Invoke Lambda after idle period
  2. Measure response time
- **Expected**: 
  - Cold start <3s
  - Acceptable for user experience

#### Test Case 20.4.2: Warm Lambda Performance
- **Steps**:
  1. Invoke Lambda repeatedly
  2. Measure response times
- **Expected**: 
  - Warm invocations <500ms
  - Consistent performance

### 20.5 CloudFront Performance

#### Test Case 20.5.1: Cache Hit Ratio
- **Steps**:
  1. Monitor CloudFront metrics
  2. Calculate cache hit ratio
- **Expected**: 
  - Cache hit ratio >80%
  - Fast asset delivery

#### Test Case 20.5.2: Geographic Distribution
- **Steps**:
  1. Access from different regions
  2. Measure latency
- **Expected**: 
  - Low latency globally
  - CloudFront edge locations utilized

---

## 21. Pre-Launch Checklist

### 21.1 Code Quality

- [ ] Remove all console.log statements
- [ ] Remove debug code and comments
- [ ] Remove unused imports and variables
- [ ] Run linter and fix all issues
- [ ] Run type checker (TypeScript)
- [ ] Code reviewed by team member

### 21.2 Environment Configuration

- [ ] Production API endpoints configured
- [ ] Cognito User Pool settings verified
- [ ] DynamoDB table names correct
- [ ] S3 bucket names correct
- [ ] CloudFront distribution configured
- [ ] Environment variables set
- [ ] No hardcoded credentials

### 21.3 Security Review

- [ ] All API endpoints require authentication
- [ ] HTTPS enforced everywhere
- [ ] CORS configured correctly
- [ ] IAM permissions follow least privilege
- [ ] S3 buckets not publicly accessible
- [ ] Secrets stored in AWS Secrets Manager
- [ ] Security headers configured

### 21.4 Performance Optimization

- [ ] Production build created
- [ ] Assets minified and compressed
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading where appropriate
- [ ] Bundle size analyzed and optimized
- [ ] Lighthouse score >90

### 21.5 Monitoring and Logging

- [ ] CloudWatch logs enabled
- [ ] CloudWatch alarms configured
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Performance monitoring enabled
- [ ] Cost alerts configured
- [ ] Backup strategy in place

### 21.6 Documentation

- [ ] README updated
- [ ] API documentation complete
- [ ] User guide created
- [ ] Deployment guide updated
- [ ] Known issues documented
- [ ] Changelog updated

### 21.7 Legal and Compliance

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie policy (if applicable)
- [ ] GDPR compliance reviewed
- [ ] Data retention policy defined
- [ ] Contact information provided

### 21.8 Testing Verification

- [ ] All test cases passed
- [ ] Cross-browser testing complete
- [ ] Mobile testing complete
- [ ] Accessibility audit passed
- [ ] Security testing complete
- [ ] Performance testing complete
- [ ] Load testing complete

### 21.9 Deployment Preparation

- [ ] Rollback plan documented
- [ ] Database backup created
- [ ] Deployment checklist created
- [ ] Team notified of deployment
- [ ] Maintenance window scheduled (if needed)
- [ ] Support team briefed

### 21.10 Post-Deployment Plan

- [ ] Smoke tests prepared
- [ ] Monitoring dashboard ready
- [ ] On-call schedule set
- [ ] Communication plan for issues
- [ ] User announcement prepared

---

## 22. Post-Deployment Smoke Tests

### 22.1 Critical Path Testing

#### Test Case 22.1.1: Sign Up New User
- **Steps**:
  1. Navigate to production URL
  2. Sign up with new email
  3. Verify email
  4. Login
- **Expected**: Complete sign up flow works

#### Test Case 22.1.2: Create Vehicle
- **Steps**:
  1. Login
  2. Create new vehicle
  3. Verify vehicle appears
- **Expected**: Vehicle creation works

#### Test Case 22.1.3: Add Refill
- **Steps**:
  1. Select vehicle
  2. Add refill
  3. Verify refill appears
- **Expected**: Refill creation works

#### Test Case 22.1.4: Add Expense
- **Steps**:
  1. Add expense
  2. Verify expense appears
- **Expected**: Expense creation works

#### Test Case 22.1.5: View Analytics
- **Steps**:
  1. Navigate to Analytics
  2. Verify charts load
  3. Verify stats display
- **Expected**: Analytics page works

### 22.2 Integration Verification

#### Test Case 22.2.1: API Connectivity
- **Steps**:
  1. Open browser DevTools
  2. Monitor Network tab
  3. Perform actions
  4. Verify API calls successful
- **Expected**: All API calls return 200/201

#### Test Case 22.2.2: Authentication
- **Steps**:
  1. Login
  2. Verify token received
  3. Make authenticated requests
- **Expected**: Auth flow works

#### Test Case 22.2.3: Database Operations
- **Steps**:
  1. Create, read, update, delete data
  2. Verify all CRUD operations
- **Expected**: Database operations work

### 22.3 PWA Verification

#### Test Case 22.3.1: Install PWA
- **Steps**:
  1. Visit site
  2. Install PWA
  3. Open from home screen
- **Expected**: PWA installs and opens

#### Test Case 22.3.2: Offline Mode
- **Steps**:
  1. Load app
  2. Go offline
  3. Verify cached content loads
- **Expected**: Offline functionality works

### 22.4 Notification Verification

#### Test Case 22.4.1: Push Notifications
- **Steps**:
  1. Subscribe to push
  2. Trigger test notification
  3. Verify received
- **Expected**: Push notifications work

#### Test Case 22.4.2: Email Notifications
- **Steps**:
  1. Create reminder
  2. Trigger email notification
  3. Verify email received
- **Expected**: Email notifications work

### 22.5 Performance Check

#### Test Case 22.5.1: Page Load Speed
- **Steps**:
  1. Clear cache
  2. Load homepage
  3. Measure load time
- **Expected**: Loads in <3s

#### Test Case 22.5.2: Lighthouse Audit
- **Steps**:
  1. Run Lighthouse on production
  2. Check scores
- **Expected**: All scores >90

### 22.6 Error Monitoring

#### Test Case 22.6.1: Check Error Logs
- **Steps**:
  1. Open CloudWatch Logs
  2. Check for errors
  3. Investigate any issues
- **Expected**: No critical errors

#### Test Case 22.6.2: Monitor Metrics
- **Steps**:
  1. Open CloudWatch Metrics
  2. Check API response times
  3. Check error rates
- **Expected**: Metrics within normal range

---

## Testing Tools and Resources

### Recommended Tools

**Browser Testing**:
- Chrome DevTools
- Firefox Developer Tools
- Safari Web Inspector
- BrowserStack (cross-browser)
- LambdaTest (cross-browser)

**Performance**:
- Lighthouse (Chrome DevTools)
- WebPageTest
- GTmetrix
- Chrome DevTools Performance tab

**Accessibility**:
- axe DevTools (browser extension)
- WAVE (browser extension)
- NVDA (screen reader - Windows)
- JAWS (screen reader - Windows)
- VoiceOver (screen reader - macOS/iOS)
- TalkBack (screen reader - Android)

**API Testing**:
- Postman
- Thunder Client (VS Code)
- curl (command line)
- AWS API Gateway Test Console

**Load Testing**:
- Artillery
- k6
- Apache JMeter
- AWS Load Testing

**Security**:
- OWASP ZAP
- Burp Suite
- AWS Security Hub
- npm audit

**Monitoring**:
- AWS CloudWatch
- Sentry (error tracking)
- LogRocket (session replay)
- Google Analytics

### Testing Checklist Summary

✅ **Functional Testing**: All features work as expected  
✅ **Cross-Browser**: Works on all major browsers  
✅ **Responsive**: Works on all device sizes  
✅ **PWA**: Installable and works offline  
✅ **i18n**: Both languages fully functional  
✅ **Performance**: Fast load times and smooth interactions  
✅ **Security**: No vulnerabilities, data protected  
✅ **Accessibility**: WCAG 2.1 AA compliant  
✅ **Data Integrity**: Calculations accurate, data consistent  
✅ **Error Handling**: Graceful error handling throughout  
✅ **Edge Cases**: Handles unusual scenarios  
✅ **Integration**: All AWS services working together  
✅ **Load**: Handles expected user load  

---

## Notes

- **Priority**: Focus on critical path tests first (auth, CRUD operations, analytics)
- **Automation**: Consider automating repetitive tests with Cypress or Playwright
- **Continuous Testing**: Integrate tests into CI/CD pipeline
- **User Acceptance**: Have real users test before launch
- **Iterative**: Testing is ongoing, not one-time
- **Documentation**: Keep this document updated as features change

**Good luck with your launch! 🚀**
