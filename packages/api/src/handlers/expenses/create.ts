import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
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
    const timestamp = new Date().toISOString();
    const currency = body.currency || 'USD';
    
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
      createdAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: expense
    }));

    return response(201, { expense });
  } catch (error) {
    console.error('Error creating expense:', error);
    return response(500, { error: 'Internal server error' });
  }
};
