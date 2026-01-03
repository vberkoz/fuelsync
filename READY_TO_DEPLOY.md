# Ready to Deploy - Notification System

## ✅ Completed Steps

1. ✅ VAPID keys generated
2. ✅ Frontend .env updated
3. ✅ API dependencies installed

## 🚀 Deploy Now

### 1. Export Environment Variables

```bash
source /tmp/vapid-env.sh
```

Or manually:
```bash
export VAPID_PUBLIC_KEY="BImPRn8wvULlu-oq3oaAIoOwR30_Bzs-W-KfemMdahI8qNPljgTFl0zQJNZ3rdOPTChSVEJPOz3OQDNWbi4dbzA"
export VAPID_PRIVATE_KEY="cCXrHnQR7TFqOVHftD58FT8_dsF56EntUl8ujpqhxIs"
export VAPID_EMAIL="noreply@fuelsync.vberkoz.com"
```

### 2. Verify SES Email (if not done)

```bash
aws ses verify-email-identity \
  --email-address noreply@fuelsync.vberkoz.com \
  --region us-east-1 \
  --profile <your-profile>
```

**Important:** Check your email inbox and click the verification link!

### 3. Deploy Infrastructure

```bash
cd packages/infrastructure
source /tmp/vapid-env.sh  # Load env vars
npx cdk deploy --all --profile <your-profile>
```

### 4. Test Notifications

1. Open app: https://app.fuelsync.vberkoz.com
2. Go to Reminders page
3. Click "Enable Push" button
4. Grant notification permission
5. Create a test reminder
6. Manually trigger check:

```bash
aws lambda invoke \
  --function-name InfrastructureStack-CheckReminders* \
  --region us-east-1 \
  --profile <your-profile> \
  output.json
```

## 📝 Notes

- **SES Sandbox Mode**: By default, SES is in sandbox mode (50 emails/day, verified recipients only)
- **Production**: Request SES production access for unlimited emails
- **Cost**: < $0.01/month for 1,000 users
- **Push Notifications**: Work even when browser is closed
- **Email Fallback**: Optional per reminder

## 🐛 Troubleshooting

**Push not working?**
- Restart dev server: `npm run dev`
- Check browser console for errors
- Verify VAPID keys match in frontend/backend

**Email not sending?**
- Verify SES email identity
- Check SES sandbox mode restrictions
- View Lambda logs: `/aws/lambda/CheckReminders`

## 📚 Documentation

- [NOTIFICATIONS.md](NOTIFICATIONS.md) - Full documentation
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick reference
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Implementation details
