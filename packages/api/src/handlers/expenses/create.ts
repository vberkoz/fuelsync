import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../../utils/dynamodb';
import { response } from '../../utils/response';
import { getExchangeRate } from '../../utils/exchange-rate';
import { randomUUID } from 'crypto';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const vehicleId = event.pathParameters?.id;
    if (!vehicleId) {
      return response(400, { error: 'Vehicle ID required' });
    }

    const body = JSON.parse(event.body || '{}');
    const expenseId = randomUUID();
    const timestamp = body.timestamp || Date.now();
    const currency = body.currency || 'USD';
    
    if (!body.odometer) {
      return response(400, { error: 'Odometer is required' });
    }
    
    const exchangeRate = await getExchangeRate(currency);
    const baseAmount = body.amount / exchangeRate;

    const expense = {
      PK: `VEHICLE#${vehicleId}`,
      SK: `EXPENSE#${timestamp}#${expenseId}`,
      expenseId,
      vehicleId,
      userId,
      category: body.category,
      amount: body.amount,
      currency,
      exchangeRate,
      baseAmount,
      odometer: body.odometer,
      description: body.description,
      taxDeductible: body.taxDeductible || false,
      timestamp,
      createdAt: new Date(timestamp).toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: expense
    }));

    // Update vehicle odometer
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `VEHICLE#${vehicleId}`
      },
      UpdateExpression: 'SET odometer = :odometer',
      ExpressionAttributeValues: {
        ':odometer': body.odometer
      }
    }));

    return response(201, { expense });
  } catch (error) {
    console.error('Error creating expense:', error);
    return response(500, { error: 'Internal server error' });
  }
};
