#!/bin/bash

BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Building app..."
cd ../app
npm run build
cd ../infrastructure

if [ "$BRANCH" = "offline" ]; then
  echo "Deploying offline environment..."
  DEPLOY_ENV=offline npx cdk deploy --all --profile basil --require-approval never
else
  echo "Deploying production environment..."
  npx cdk deploy --all --profile basil --require-approval never
fi
