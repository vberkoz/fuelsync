# Notification System Setup

## Overview

Hybrid notification system with Web Push (primary) and Email (fallback).

## Setup Steps

### 1. Generate VAPID Keys

```bash
cd packages/api
npm install
node generate-vapid-keys.js
```

### 2. Configure Environment Variables

**Backend** (`packages/infrastructure/.env` or export before deploy):
```bash
export VAPID_PUBLIC_KEY="your-public-key"
export VAPID_PRIVATE_KEY="your-private-key"
export VAPID_EMAIL="noreply@fuelsync.vberkoz.com"
```

**Frontend** (`packages/app/.env`):
```bash
VITE_VAPID_PUBLIC_KEY="your-public-key"
```

### 3. Verify SES Email

```bash
aws ses verify-email-identity --email-address noreply@fuelsync.vberkoz.com --region us-east-1
```

Check your email and click the verification link.

### 4. Deploy Infrastructure

```bash
cd packages/infrastructure
npx cdk deploy --all
```

### 5. Build and Deploy Frontend

```bash
cd packages/app
npm run build
# Deploy will happen automatically via CDK
```

## Usage

### Enable Notifications (User)

1. Go to Reminders page
2. Click "Enable Push" button
3. Grant notification permission
4. Create reminders with thresholds

### Create Reminder

```typescript
{
  vehicleId: "vehicle_123",
  title: "Oil Change",
  type: "Maintenance",
  threshold: 5000,
  unit: "km",
  notifyEmail: true  // Optional email fallback
}
```

### How It Works

1. **EventBridge** runs daily Lambda check
2. **Lambda** queries active reminders
3. Compares vehicle odometer vs threshold
4. If ≥80%, sends **Web Push** to all subscriptions
5. If `notifyEmail: true`, sends **SES email**

## Cost Estimate

- **Web Push**: Free (browser API)
- **Email (SES)**: Free tier 62k/month
- **EventBridge**: ~$0.00003/month
- **Lambda**: Free tier covers usage
- **Total**: < $0.01/month for <10k users

## Testing

### Test Push Notification

```bash
# Subscribe via UI, then manually trigger Lambda
aws lambda invoke --function-name CheckReminders output.json
```

### Test Email

Ensure SES is verified and out of sandbox mode for production.

## Troubleshooting

**Push not working?**
- Check VAPID keys match frontend/backend
- Verify service worker registered
- Check browser console for errors
- iOS Safari requires PWA installed

**Email not sending?**
- Verify SES email identity
- Check SES sandbox mode (50 emails/day limit)
- Request production access for unlimited

## Architecture

```
User → Reminders Page → API Gateway → Lambda (Create/List/Delete)
                                          ↓
                                      DynamoDB (Reminders + Subscriptions)
                                          ↓
EventBridge (Daily) → Lambda (Check) → Web Push + SES Email
```
