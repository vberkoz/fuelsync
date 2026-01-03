# Quick Deployment Guide - Notifications

## 1. Install Dependencies

```bash
cd packages/api
npm install

cd ../infrastructure
npm install
```

## 2. Generate VAPID Keys

```bash
cd packages/api
node generate-vapid-keys.js
```

Copy the output keys.

## 3. Set Environment Variables

**Option A: Export before deploy**
```bash
export VAPID_PUBLIC_KEY="BN..."
export VAPID_PRIVATE_KEY="..."
export VAPID_EMAIL="noreply@fuelsync.vberkoz.com"
```

**Option B: Create .env file** (packages/infrastructure/.env)
```
VAPID_PUBLIC_KEY=BN...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=noreply@fuelsync.vberkoz.com
```

## 4. Update Frontend .env

```bash
cd packages/app
echo "VITE_VAPID_PUBLIC_KEY=BN..." >> .env
```

## 5. Verify SES Email

```bash
aws ses verify-email-identity \
  --email-address noreply@fuelsync.vberkoz.com \
  --region us-east-1
```

Check email and click verification link.

## 6. Deploy

```bash
cd packages/infrastructure
npx cdk deploy --all
```

## 7. Test

1. Open app → Reminders page
2. Click "Enable Push"
3. Create a reminder
4. Manually trigger check:
```bash
aws lambda invoke \
  --function-name InfrastructureStack-CheckReminders... \
  --region us-east-1 \
  output.json
```

## Done! 🎉

Users can now:
- Create reminders with km/days/months thresholds
- Receive push notifications when ≥80% threshold
- Optionally enable email fallback
- Manage reminders from UI
