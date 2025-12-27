#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new cdk.App();
new InfrastructureStack(app, 'FuelSyncStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-east-1' 
  },
  crossRegionReferences: true
});
