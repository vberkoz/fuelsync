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
    const refillId = randomUUID();
    const timestamp = body.timestamp || Date.now();
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
      odometerImageKey: body.odometerImageKey,
      pumpImageKey: body.pumpImageKey,
      receiptImageKey: body.receiptImageKey,
      ...(body.media && body.media.length > 0 && { media: body.media }),
      timestamp,
      createdAt: new Date(timestamp).toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: refill
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

    return response(201, { refill });
  } catch (error) {
    console.error('Error creating refill:', error);
    return response(500, { error: 'Internal server error' });
  }
};
