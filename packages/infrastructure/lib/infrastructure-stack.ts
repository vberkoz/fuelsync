import * as cdk from 'aws-cdk-lib/core';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
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

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'FuelSyncUserPool', {
      userPoolName: 'FuelSyncUserPool',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true
      },
      autoVerify: {
        email: true
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        },
        givenName: {
          required: false,
          mutable: true
        },
        familyName: {
          required: false,
          mutable: true
        }
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY
    });

    // User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'FuelSyncUserPoolClient', {
      userPool,
      userPoolClientName: 'FuelSyncWebClient',
      authFlows: {
        userPassword: true,
        userSrp: true
      },
      generateSecret: false,
      accessTokenValidity: cdk.Duration.minutes(60),
      idTokenValidity: cdk.Duration.minutes(60),
      refreshTokenValidity: cdk.Duration.days(30)
    });

    // Lambda functions
    const lambdaEnvironment = {
      TABLE_NAME: table.tableName
    };

    const listVehicles = new nodejs.NodejsFunction(this, 'ListVehicles', {
      entry: '../api/src/handlers/vehicles/list.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const createVehicle = new nodejs.NodejsFunction(this, 'CreateVehicle', {
      entry: '../api/src/handlers/vehicles/create.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const listRefills = new nodejs.NodejsFunction(this, 'ListRefills', {
      entry: '../api/src/handlers/refills/list.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const createRefill = new nodejs.NodejsFunction(this, 'CreateRefill', {
      entry: '../api/src/handlers/refills/create.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const listExpenses = new nodejs.NodejsFunction(this, 'ListExpenses', {
      entry: '../api/src/handlers/expenses/list.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const createExpense = new nodejs.NodejsFunction(this, 'CreateExpense', {
      entry: '../api/src/handlers/expenses/create.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    // Grant DynamoDB permissions
    table.grantReadData(listVehicles);
    table.grantWriteData(createVehicle);
    table.grantReadData(listRefills);
    table.grantWriteData(createRefill);
    table.grantReadData(listExpenses);
    table.grantWriteData(createExpense);

    // API Gateway
    const api = new apigateway.RestApi(this, 'FuelSyncApi', {
      restApiName: 'FuelSync API',
      description: 'API for FuelSync vehicle expense tracking',
      deployOptions: {
        stageName: 'v1'
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      }
    });

    // /vehicles resource
    const vehicles = api.root.addResource('vehicles');
    vehicles.addMethod('GET', new apigateway.LambdaIntegration(listVehicles));
    vehicles.addMethod('POST', new apigateway.LambdaIntegration(createVehicle));

    // /vehicles/{id}/refills resource
    const vehicleId = vehicles.addResource('{id}');
    const refills = vehicleId.addResource('refills');
    refills.addMethod('GET', new apigateway.LambdaIntegration(listRefills));
    refills.addMethod('POST', new apigateway.LambdaIntegration(createRefill));

    // /vehicles/{id}/expenses resource
    const expenses = vehicleId.addResource('expenses');
    expenses.addMethod('GET', new apigateway.LambdaIntegration(listExpenses));
    expenses.addMethod('POST', new apigateway.LambdaIntegration(createExpense));

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

    new cdk.CfnOutput(this, 'ListVehiclesFunctionArn', {
      value: listVehicles.functionArn
    });

    new cdk.CfnOutput(this, 'CreateVehicleFunctionArn', {
      value: createVehicle.functionArn
    });

    new cdk.CfnOutput(this, 'ListRefillsFunctionArn', {
      value: listRefills.functionArn
    });

    new cdk.CfnOutput(this, 'CreateRefillFunctionArn', {
      value: createRefill.functionArn
    });

    new cdk.CfnOutput(this, 'ListExpensesFunctionArn', {
      value: listExpenses.functionArn
    });

    new cdk.CfnOutput(this, 'CreateExpenseFunctionArn', {
      value: createExpense.functionArn
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId
    });
  }
}
