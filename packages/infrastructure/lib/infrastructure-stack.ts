import * as cdk from 'aws-cdk-lib/core';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'FuelSyncTable', {
      tableName: 'FuelSyncTable',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true }
    });

    // GSI1 for inverted index (user queries, email lookup)
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // GSI2 for date-based queries (monthly expenses, category filters)
    table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    const domainName = 'fuelsync.vberkoz.com';
    const appDomainName = 'app.fuelsync.vberkoz.com';
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'vberkoz.com'
    });

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName,
      subjectAlternativeNames: [appDomainName],
      validation: acm.CertificateValidation.fromDns(hostedZone)
    });

    const landingBucket = new s3.Bucket(this, 'LandingBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const appBucket = new s3.Bucket(this, 'AppBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const landingDistribution = new cloudfront.Distribution(this, 'LandingDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(landingBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      domainNames: [domainName],
      certificate,
      defaultRootObject: 'index.html'
    });

    const appDistribution = new cloudfront.Distribution(this, 'AppDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(appBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      domainNames: [appDomainName],
      certificate,
      defaultRootObject: 'index.html',
      errorResponses: [{
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html'
      }]
    });

    new route53.ARecord(this, 'LandingRecord', {
      zone: hostedZone,
      recordName: 'fuelsync',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(landingDistribution))
    });

    new route53.ARecord(this, 'AppRecord', {
      zone: hostedZone,
      recordName: 'app.fuelsync',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(appDistribution))
    });

    new s3deploy.BucketDeployment(this, 'LandingDeployment', {
      sources: [s3deploy.Source.asset('../landing/dist')],
      destinationBucket: landingBucket,
      distribution: landingDistribution,
      distributionPaths: ['/*']
    });

    new s3deploy.BucketDeployment(this, 'AppDeployment', {
      sources: [s3deploy.Source.asset('../app/dist')],
      destinationBucket: appBucket,
      distribution: appDistribution,
      distributionPaths: ['/*']
    });

    new cdk.CfnOutput(this, 'LandingURL', {
      value: `https://${domainName}`
    });

    new cdk.CfnOutput(this, 'AppURL', {
      value: `https://${appDomainName}`
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: table.tableArn
    });
  }
}
