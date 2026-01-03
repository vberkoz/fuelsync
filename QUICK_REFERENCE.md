# Notification System - Quick Reference

## 🚀 Quick Start

```bash
# 1. Setup
./setup-notifications.sh

# 2. Set environment variables (from setup output)
export VAPID_PUBLIC_KEY="..."
export VAPID_PRIVATE_KEY="..."

# 3. Verify SES
aws ses verify-email-identity --email-address noreply@fuelsync.vberkoz.com

# 4. Deploy
cd packages/infrastructure && npx cdk deploy --all
```

## 📁 New Files

### Backend
```
packages/api/src/handlers/
├── reminders/
│   ├── create.ts          # POST /reminders
│   ├── list.ts            # GET /reminders
│   └── delete.ts          # DELETE /reminders/{id}
└── notifications/
    ├── subscribe.ts       # POST /notifications/subscribe
    └── check-reminders.ts # EventBridge daily trigger
```

### Frontend
```
packages/app/src/
├── lib/notifications.ts   # Push notification utilities
└── public/sw-push.js      # Service worker for push events
```

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/reminders` | ✅ | List user reminders |
| POST | `/reminders` | ✅ | Create reminder |
| DELETE | `/reminders/{id}` | ✅ | Delete reminder |
| POST | `/notifications/subscribe` | ✅ | Subscribe to push |

## 📊 DynamoDB Schema

```javascript
// Reminder
{
  PK: "USER#123",
  SK: "REMINDER#456",
  reminderId: "reminder_1234567890",
  vehicleId: "vehicle_abc",
  userId: "123",
  title: "Oil Change",
  type: "Maintenance",
  threshold: 5000,
  unit: "km",
  notifyEmail: true,
  status: "active",
  createdAt: "2025-01-15T10:00:00Z"
}

// Push Subscription
{
  PK: "USER#123",
  SK: "SUBSCRIPTION#789",
  subscriptionId: "sub_1234567890",
  userId: "123",
  subscription: { endpoint: "...", keys: {...} },
  createdAt: "2025-01-15T10:00:00Z"
}
```

## 🔔 Notification Flow

```
EventBridge (daily)
    ↓
Lambda: check-reminders
    ↓
Query: Active reminders
    ↓
For each reminder:
    ↓
Fetch vehicle odometer
    ↓
Calculate: progress = current / threshold
    ↓
If progress ≥ 80%:
    ↓
    ├─→ Web Push (all subscriptions)
    └─→ Email (if notifyEmail: true)
```

## 💰 Cost Breakdown

| Service | Free Tier | Cost (1k users) |
|---------|-----------|-----------------|
| Web Push | Unlimited | $0 |
| SES Email | 62k/month | $0 |
| EventBridge | 1M events | < $0.01 |
| Lambda | 1M requests | $0 |
| DynamoDB | 25GB | $0 |
| **Total** | - | **< $0.01/month** |

## 🧪 Testing

```bash
# 1. Create reminder via UI
# 2. Manually trigger check
aws lambda invoke \
  --function-name InfrastructureStack-CheckReminders... \
  output.json

# 3. Check logs
aws logs tail /aws/lambda/CheckReminders --follow
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Push not working | Check VAPID keys match, verify SW registered |
| Email not sending | Verify SES email, check sandbox mode |
| No notifications | Check EventBridge rule enabled, Lambda logs |
| iOS not working | Ensure PWA installed, not just browser |

## 📱 Browser Support

| Browser | Push | Notes |
|---------|------|-------|
| Chrome | ✅ | Full support |
| Firefox | ✅ | Full support |
| Safari (macOS) | ✅ | Full support |
| Safari (iOS) | ⚠️ | PWA only |
| Edge | ✅ | Full support |

## 🔐 Environment Variables

**Backend:**
```bash
VAPID_PUBLIC_KEY=BN...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=noreply@fuelsync.vberkoz.com
FROM_EMAIL=noreply@fuelsync.vberkoz.com
```

**Frontend:**
```bash
VITE_VAPID_PUBLIC_KEY=BN...
```

## 📚 Documentation

- [NOTIFICATIONS.md](NOTIFICATIONS.md) - Full documentation
- [DEPLOY_NOTIFICATIONS.md](DEPLOY_NOTIFICATIONS.md) - Deployment guide
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Implementation details

## 🎯 Key Features

✅ Web Push notifications (works when browser closed)  
✅ Email fallback (optional per reminder)  
✅ Daily automated checks via EventBridge  
✅ Vehicle-specific reminders (km/days/months)  
✅ 80% threshold trigger  
✅ Full CRUD UI  
✅ Service Worker integration  
✅ < $0.01/month cost for 1k users  

## 🔄 Update Existing Deployment

```bash
# 1. Pull latest code
git pull

# 2. Install new dependencies
cd packages/api && npm install
cd ../infrastructure && npm install

# 3. Generate VAPID keys (if not done)
cd ../api && node generate-vapid-keys.js

# 4. Set environment variables
export VAPID_PUBLIC_KEY="..."
export VAPID_PRIVATE_KEY="..."

# 5. Deploy
cd ../infrastructure && npx cdk deploy --all
```
