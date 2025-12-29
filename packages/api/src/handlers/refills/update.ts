import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../../utils/dynamodb';
import { response } from '../../utils/response';

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

    // First, find the exact SK
    const queryResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND contains(SK, :refillId)',
      ExpressionAttributeValues: {
        ':pk': `VEHICLE#${vehicleId}`,
        ':refillId': refillId
      },
      Limit: 1
    }));

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return response(404, { error: 'Refill not found' });
    }

    const existingSK = queryResult.Items[0].SK;

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `VEHICLE#${vehicleId}`,
        SK: existingSK
      },
      UpdateExpression: 'SET odometer = :odometer, volume = :volume, pricePerUnit = :pricePerUnit, totalCost = :totalCost, currency = :currency, fuelType = :fuelType, station = :station, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':odometer': body.odometer,
        ':volume': body.volume,
        ':pricePerUnit': body.pricePerUnit,
        ':totalCost': body.totalCost,
        ':currency': body.currency || 'USD',
        ':fuelType': body.fuelType,
        ':station': body.station,
        ':updatedAt': timestamp
      },
      ReturnValues: 'ALL_NEW'
    }));

    return response(200, { refill: result.Attributes });
  } catch (error) {
    console.error('Error updating refill:', error);
    return response(500, { error: 'Internal server error' });
  }
};
