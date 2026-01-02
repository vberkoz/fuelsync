# FuelSync Infrastructure

AWS CDK infrastructure for FuelSync serverless application.

## ✅ Deployed Resources

- **DynamoDB**: Single-table design with GSI1/GSI2 indexes
- **Lambda**: 20+ functions for auth, CRUD, analytics
- **API Gateway**: REST API with CORS and Lambda proxy integration
- **Cognito**: User pool with email authentication
- **S3**: Buckets for app hosting and user uploads
- **CloudFront**: CDN distributions with custom domains
- **Route53**: DNS configuration with SSL certificates

## Deployment

```bash
cd packages/infrastructure
npm install
npx cdk deploy --all --profile <your-profile>
```

## Stack Resources

### DynamoDB Table: FuelSyncTable
- **Billing**: Pay-per-request (on-demand)
- **Indexes**: GSI1 (user queries), GSI2 (date-based queries)
- **Backup**: Point-in-time recovery enabled

### Lambda Functions
- **Auth**: register, login, refresh (3 functions)
- **Vehicles**: CRUD + statistics + charts (7 functions)
- **Refills**: CRUD operations (5 functions)
- **Expenses**: CRUD operations (5 functions)
- **Users**: profile + settings (4 functions)
- **Dashboard**: summary data (1 function)

### API Gateway
- **Stage**: v1
- **CORS**: Enabled for all origins
- **Integration**: Lambda proxy with automatic deployments

## Useful Commands

- `npm run build` - Compile TypeScript to JS
- `npm run watch` - Watch for changes and compile
- `npm run test` - Run Jest unit tests
- `npx cdk deploy` - Deploy stack to AWS
- `npx cdk diff` - Compare deployed vs current state
- `npx cdk synth` - Generate CloudFormation template
- `npx cdk destroy` - Delete all resources
