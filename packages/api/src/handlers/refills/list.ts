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

    const vehicleId = event.pathParameters?.vehicleId;
    if (!vehicleId) {
      return response(400, { error: 'Vehicle ID required' });
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `VEHICLE#${vehicleId}`,
        ':sk': 'REFILL#'
      },
      ScanIndexForward: false
    }));

    return response(200, { refills: result.Items || [] });
  } catch (error) {
    console.error('Error listing refills:', error);
    return response(500, { error: 'Internal server error' });
  }
};
