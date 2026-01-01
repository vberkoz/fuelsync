import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
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

    const queryResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `VEHICLE#${vehicleId}`,
        ':sk': 'REFILL#'
      }
    }));

    const item = queryResult.Items?.find(i => i.refillId === refillId);
    if (!item) {
      return response(404, { error: 'Refill not found' });
    }

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: item.PK,
        SK: item.SK
      }
    }));

    return response(200, { message: 'Refill deleted successfully' });
  } catch (error) {
    console.error('Error deleting refill:', error);
    return response(500, { error: 'Internal server error' });
  }
};
