#!/bin/bash

set -e

echo "🔔 FuelSync Notification System Setup"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "packages/api/package.json" ]; then
    echo "❌ Error: Run this script from the fuelsync root directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
cd packages/api
npm install
cd ../infrastructure
npm install
cd ../..

# Step 2: Generate VAPID keys
echo ""
echo "🔑 Generating VAPID keys..."
cd packages/api
node generate-vapid-keys.js > /tmp/vapid-keys.txt
cd ../..

# Step 3: Display keys and instructions
echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Add these environment variables to packages/infrastructure/.env:"
echo "   (or export them before deploying)"
echo ""
cat /tmp/vapid-keys.txt
echo ""
echo "2. Verify SES email:"
echo "   aws ses verify-email-identity --email-address noreply@fuelsync.vberkoz.com --region us-east-1"
echo ""
echo "3. Deploy infrastructure:"
echo "   cd packages/infrastructure"
echo "   npx cdk deploy --all"
echo ""
echo "4. Update packages/app/.env with VITE_VAPID_PUBLIC_KEY"
echo ""
echo "📖 See DEPLOY_NOTIFICATIONS.md for detailed instructions"
echo ""

# Cleanup
rm /tmp/vapid-keys.txt
