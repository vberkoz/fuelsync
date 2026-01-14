import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { successResponse, errorResponse } from '../../utils/response';
import { invokeNovaMicro } from '../../utils/bedrock';
import { buildMonthlySummaryPrompt } from '../../utils/ai-prompts';
import { convertToTargetCurrency, convertVolume } from '../../utils/currency-converter';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Monthly summary handler invoked');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const vehicleId = event.pathParameters?.id;
    const userId = event.requestContext.authorizer?.claims.sub;

    console.log('VehicleId:', vehicleId, 'UserId:', userId);

    if (!vehicleId || !userId) {
      return errorResponse('Missing required parameters', 400);
    }

    // Fetch user settings
    const settingsResult = await dynamodb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'SETTINGS'
      }
    }));

    const settings = settingsResult.Item || { preferredCurrency: 'USD', units: 'metric' };
    const isMetric = settings.units === 'metric';
    const targetCurrency = settings.preferredCurrency || 'USD';

    // Fetch vehicle
    const vehicleResult = await client.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': { S: `USER#${userId}` },
        ':sk': { S: `VEHICLE#${vehicleId}` }
      }
    }));

    if (!vehicleResult.Items || vehicleResult.Items.length === 0) {
      return errorResponse('Vehicle not found', 404);
    }

    const vehicle = unmarshall(vehicleResult.Items[0]);

    // Fetch all refills for vehicle
    const refillsResult = await client.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': { S: `VEHICLE#${vehicleId}` },
        ':sk': { S: 'REFILL#' }
      }
    }));

    const refills = refillsResult.Items?.map(item => unmarshall(item)) || [];

    // Fetch all expenses for vehicle
    const expensesResult = await client.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': { S: `VEHICLE#${vehicleId}` },
        ':sk': { S: 'EXPENSE#' }
      }
    }));

    const expenses = expensesResult.Items?.map(item => unmarshall(item)) || [];

    // Create data hash for cache validation
    const dataHash = `${refills.length}-${expenses.length}`;
    const cacheKey = `CACHE#INSIGHTS#${vehicleId}#monthly`;

    // Check cache
    const cacheResult = await dynamodb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: cacheKey
      }
    }));

    // Return cached if data hasn't changed
    if (cacheResult.Item && cacheResult.Item.dataHash === dataHash) {
      return successResponse({
        summaries: cacheResult.Item.summaries || { en: cacheResult.Item.summary || '', uk: cacheResult.Item.summary || '' },
        metadata: cacheResult.Item.metadata,
        cached: true
      });
    }

    // Convert all amounts to target currency using historical rates from DynamoDB
    const convertedRefills = await Promise.all(
      refills.map(async (r) => {
        const convertedCost = await convertToTargetCurrency(
          r.totalCost || 0,
          r.currency || 'USD',
          targetCurrency,
          r.timestamp || Date.now()
        );
        const convertedPrice = await convertToTargetCurrency(
          r.pricePerUnit || 0,
          r.currency || 'USD',
          targetCurrency,
          r.timestamp || Date.now()
        );
        return {
          ...r,
          totalCost: convertedCost,
          pricePerUnit: convertedPrice,
          currency: targetCurrency,
          volume: convertVolume(r.volume || 0, !isMetric)
        };
      })
    );
    const totalFuelCost = convertedRefills.reduce((sum, r) => sum + r.totalCost, 0);

    const convertedExpenses = await Promise.all(
      expenses.map(async (e) => {
        const convertedAmount = await convertToTargetCurrency(
          e.amount || 0,
          e.currency || 'USD',
          targetCurrency,
          e.timestamp || Date.now()
        );
        return {
          ...e,
          amount: convertedAmount,
          currency: targetCurrency
        };
      })
    );
    const totalExpenses = convertedExpenses.reduce((sum, e) => sum + e.amount, 0);

    const totalVolume = convertedRefills.reduce((sum, r) => sum + r.volume, 0);
    
    const statistics = {
      totalFuelCost: totalFuelCost.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      avgVolume: convertedRefills.length > 0 ? (totalVolume / convertedRefills.length).toFixed(2) : '0',
      currency: targetCurrency,
      volumeUnit: isMetric ? 'liters' : 'gallons',
      distanceUnit: isMetric ? 'km' : 'miles'
    };

    // Build prompt with converted data
    const prompt = buildMonthlySummaryPrompt({
      vehicle,
      refills: convertedRefills,
      expenses: convertedExpenses,
      statistics,
      timeframe: 'Last 30 days'
    });

    const startTime = Date.now();
    const aiResponse = await invokeNovaMicro(prompt);
    const latency = Date.now() - startTime;

    const metadata = {
      vehicleId,
      refillCount: convertedRefills.length,
      expenseCount: convertedExpenses.length,
      generatedAt: new Date().toISOString(),
      latencyMs: latency
    };

    let summaries;
    try {
      summaries = JSON.parse(aiResponse);
    } catch {
      summaries = { en: aiResponse, uk: aiResponse };
    }

    await dynamodb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: cacheKey,
        summaries,
        metadata,
        dataHash,
        timestamp: Date.now()
      }
    }));

    return successResponse({
      summaries,
      metadata,
      cached: false
    });

  } catch (error) {
    console.error('Error generating monthly summary:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return errorResponse(`Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
};
