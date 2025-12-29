import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
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

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND contains(SK, :refillId)',
      ExpressionAttributeValues: {
        ':pk': `VEHICLE#${vehicleId}`,
        ':refillId': refillId
      },
      Limit: 1
    }));

    if (!result.Items || result.Items.length === 0) {
      return response(404, { error: 'Refill not found' });
    }

    return response(200, { refill: result.Items[0] });
  } catch (error) {
    console.error('Error getting refill:', error);
    return response(500, { error: 'Internal server error' });
  }
};
