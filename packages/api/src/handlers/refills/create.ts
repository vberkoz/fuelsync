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
    const refillId = randomUUID();
    const timestamp = new Date().toISOString();
    const currency = body.currency || 'USD';
    
    const exchangeRate = await getExchangeRate(currency);
    const baseAmount = body.totalCost / exchangeRate;

    const refill = {
      PK: `VEHICLE#${vehicleId}`,
      SK: `REFILL#${timestamp}#${refillId}`,
      refillId,
      vehicleId,
      userId,
      odometer: body.odometer,
      volume: body.volume,
      pricePerUnit: body.pricePerUnit,
      totalCost: body.totalCost,
      currency,
      exchangeRate,
      baseAmount,
      fuelType: body.fuelType,
      station: body.station,
      createdAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: refill
    }));

    return response(201, { refill });
  } catch (error) {
    console.error('Error creating refill:', error);
    return response(500, { error: 'Internal server error' });
  }
};
