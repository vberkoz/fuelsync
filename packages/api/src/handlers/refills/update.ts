import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../../utils/dynamodb';
import { response } from '../../utils/response';
import { getExchangeRate } from '../../utils/exchange-rate';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const vehicleId = event.pathParameters?.id;
    const refillId = event.pathParameters?.refillId;
    
    if (!vehicleId || !refillId) {
      return response(400, { error: 'Vehicle ID and Refill ID required' });
    }

    const body = JSON.parse(event.body || '{}');
    const timestamp = new Date().toISOString();
    const currency = body.currency || 'USD';
    
    const exchangeRate = await getExchangeRate(currency);
    const baseAmount = body.totalCost / exchangeRate;

    // First, find the exact SK
    const queryResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `VEHICLE#${vehicleId}`,
        ':sk': 'REFILL#'
      }
    }));

    const refill = queryResult.Items?.find(item => item.refillId === refillId);

    if (!refill) {
      return response(404, { error: 'Refill not found' });
    }

    const existingSK = refill.SK;

    const updateExpressionParts = [
      'odometer = :odometer',
      'volume = :volume',
      'pricePerUnit = :pricePerUnit',
      'totalCost = :totalCost',
      'currency = :currency',
      'exchangeRate = :exchangeRate',
      'baseAmount = :baseAmount',
      'fuelType = :fuelType',
      'station = :station',
      'updatedAt = :updatedAt'
    ];
    
    const expressionAttributeValues: any = {
      ':odometer': body.odometer,
      ':volume': body.volume,
      ':pricePerUnit': body.pricePerUnit,
      ':totalCost': body.totalCost,
      ':currency': currency,
      ':exchangeRate': exchangeRate,
      ':baseAmount': baseAmount,
      ':fuelType': body.fuelType,
      ':station': body.station,
      ':updatedAt': timestamp
    };
    
    if (body.media !== undefined) {
      updateExpressionParts.push('media = :media');
      expressionAttributeValues[':media'] = body.media;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `VEHICLE#${vehicleId}`,
        SK: existingSK
      },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
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

    return response(200, { refill: result.Attributes });
  } catch (error) {
    console.error('Error updating refill:', error);
    return response(500, { error: 'Internal server error' });
  }
};
