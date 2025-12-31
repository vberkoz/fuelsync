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

    // S3 bucket for user uploads (receipts, photos)
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `fuelsync-uploads-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
        allowedOrigins: ['*'],
        allowedHeaders: ['*']
      }],
      lifecycleRules: [{
        transitions: [{
          storageClass: s3.StorageClass.INTELLIGENT_TIERING,
          transitionAfter: cdk.Duration.days(30)
        }]
      }]
    });

    // Lambda functions
    const lambdaEnvironment = {
      TABLE_NAME: table.tableName,
      UPLOADS_BUCKET_NAME: uploadsBucket.bucketName,
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId
    };

    const registerUser = new nodejs.NodejsFunction(this, 'RegisterUser', {
      entry: '../api/src/handlers/auth/register.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const loginUser = new nodejs.NodejsFunction(this, 'LoginUser', {
      entry: '../api/src/handlers/auth/login.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const refreshToken = new nodejs.NodejsFunction(this, 'RefreshToken', {
      entry: '../api/src/handlers/auth/refresh.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const confirmEmail = new nodejs.NodejsFunction(this, 'ConfirmEmail', {
      entry: '../api/src/handlers/auth/confirm.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const resendCode = new nodejs.NodejsFunction(this, 'ResendCode', {
      entry: '../api/src/handlers/auth/resend-code.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

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

    const getVehicle = new nodejs.NodejsFunction(this, 'GetVehicle', {
      entry: '../api/src/handlers/vehicles/get.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const updateVehicle = new nodejs.NodejsFunction(this, 'UpdateVehicle', {
      entry: '../api/src/handlers/vehicles/update.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const deleteVehicle = new nodejs.NodejsFunction(this, 'DeleteVehicle', {
      entry: '../api/src/handlers/vehicles/delete.ts',
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

    const getRefill = new nodejs.NodejsFunction(this, 'GetRefill', {
      entry: '../api/src/handlers/refills/get.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const updateRefill = new nodejs.NodejsFunction(this, 'UpdateRefill', {
      entry: '../api/src/handlers/refills/update.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const deleteRefill = new nodejs.NodejsFunction(this, 'DeleteRefill', {
      entry: '../api/src/handlers/refills/delete.ts',
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

    const getExpense = new nodejs.NodejsFunction(this, 'GetExpense', {
      entry: '../api/src/handlers/expenses/get.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const updateExpense = new nodejs.NodejsFunction(this, 'UpdateExpense', {
      entry: '../api/src/handlers/expenses/update.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const deleteExpense = new nodejs.NodejsFunction(this, 'DeleteExpense', {
      entry: '../api/src/handlers/expenses/delete.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false
      }
    });

    const getStatistics = new nodejs.NodejsFunction(this, 'GetStatistics', {
      entry: '../api/src/handlers/vehicles/statistics.ts',
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
    table.grantReadData(getVehicle);
    table.grantReadWriteData(updateVehicle);
    table.grantWriteData(deleteVehicle);
    table.grantReadData(listRefills);
    table.grantWriteData(createRefill);
    table.grantReadData(getRefill);
    table.grantReadWriteData(updateRefill);
    table.grantWriteData(deleteRefill);
    table.grantReadData(listExpenses);
    table.grantWriteData(createExpense);
    table.grantReadData(getExpense);
    table.grantReadWriteData(updateExpense);
    table.grantWriteData(deleteExpense);
    table.grantReadData(getStatistics);

    // Grant S3 read permissions to all Lambda functions
    uploadsBucket.grantRead(listVehicles);
    uploadsBucket.grantRead(createVehicle);
    uploadsBucket.grantRead(listRefills);
    uploadsBucket.grantRead(createRefill);
    uploadsBucket.grantRead(listExpenses);
    uploadsBucket.grantRead(createExpense);

    // Grant S3 write permissions to create functions
    uploadsBucket.grantWrite(createRefill);
    uploadsBucket.grantWrite(createExpense);

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

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool]
    });

    // /auth resource
    const auth = api.root.addResource('auth');
    const register = auth.addResource('register');
    register.addMethod('POST', new apigateway.LambdaIntegration(registerUser));
    const login = auth.addResource('login');
    login.addMethod('POST', new apigateway.LambdaIntegration(loginUser));
    const refresh = auth.addResource('refresh');
    refresh.addMethod('POST', new apigateway.LambdaIntegration(refreshToken));
    const confirm = auth.addResource('confirm');
    confirm.addMethod('POST', new apigateway.LambdaIntegration(confirmEmail));
    const resend = auth.addResource('resend-code');
    resend.addMethod('POST', new apigateway.LambdaIntegration(resendCode));

    // /vehicles resource
    const vehicles = api.root.addResource('vehicles');
    vehicles.addMethod('GET', new apigateway.LambdaIntegration(listVehicles), { authorizer });
    vehicles.addMethod('POST', new apigateway.LambdaIntegration(createVehicle), { authorizer });

    // /vehicles/{id} resource
    const vehicleId = vehicles.addResource('{id}');
    vehicleId.addMethod('GET', new apigateway.LambdaIntegration(getVehicle), { authorizer });
    vehicleId.addMethod('PUT', new apigateway.LambdaIntegration(updateVehicle), { authorizer });
    vehicleId.addMethod('DELETE', new apigateway.LambdaIntegration(deleteVehicle), { authorizer });

    // /vehicles/{id}/refills resource
    const refills = vehicleId.addResource('refills');
    refills.addMethod('GET', new apigateway.LambdaIntegration(listRefills), { authorizer });
    refills.addMethod('POST', new apigateway.LambdaIntegration(createRefill), { authorizer });

    // /vehicles/{id}/refills/{refillId} resource
    const refillId = refills.addResource('{refillId}');
    refillId.addMethod('GET', new apigateway.LambdaIntegration(getRefill), { authorizer });
    refillId.addMethod('PUT', new apigateway.LambdaIntegration(updateRefill), { authorizer });
    refillId.addMethod('DELETE', new apigateway.LambdaIntegration(deleteRefill), { authorizer });

    // /vehicles/{id}/expenses resource
    const expenses = vehicleId.addResource('expenses');
    expenses.addMethod('GET', new apigateway.LambdaIntegration(listExpenses), { authorizer });
    expenses.addMethod('POST', new apigateway.LambdaIntegration(createExpense), { authorizer });

    // /vehicles/{id}/expenses/{expenseId} resource
    const expenseId = expenses.addResource('{expenseId}');
    expenseId.addMethod('GET', new apigateway.LambdaIntegration(getExpense), { authorizer });
    expenseId.addMethod('PUT', new apigateway.LambdaIntegration(updateExpense), { authorizer });
    expenseId.addMethod('DELETE', new apigateway.LambdaIntegration(deleteExpense), { authorizer });

    // /vehicles/{id}/statistics resource
    const statistics = vehicleId.addResource('statistics');
    statistics.addMethod('GET', new apigateway.LambdaIntegration(getStatistics), { authorizer });

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
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        }
      ]
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

    new cdk.CfnOutput(this, 'GetVehicleFunctionArn', {
      value: getVehicle.functionArn
    });

    new cdk.CfnOutput(this, 'UpdateVehicleFunctionArn', {
      value: updateVehicle.functionArn
    });

    new cdk.CfnOutput(this, 'DeleteVehicleFunctionArn', {
      value: deleteVehicle.functionArn
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

    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: uploadsBucket.bucketName
    });

    new cdk.CfnOutput(this, 'RegisterUserFunctionArn', {
      value: registerUser.functionArn
    });

    new cdk.CfnOutput(this, 'LoginUserFunctionArn', {
      value: loginUser.functionArn
    });

    new cdk.CfnOutput(this, 'RefreshTokenFunctionArn', {
      value: refreshToken.functionArn
    });
  }
}
