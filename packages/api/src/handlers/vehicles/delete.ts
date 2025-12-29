import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../../utils/dynamodb';
import { response } from '../../utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const vehicleId = event.pathParameters?.id;
    if (!vehicleId) {
      return response(400, { error: 'Vehicle ID is required' });
    }

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `VEHICLE#${vehicleId}`
      },
      ConditionExpression: 'attribute_exists(PK)'
    }));

    return response(200, { message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return response(404, { error: 'Vehicle not found' });
    }
    console.error('Error deleting vehicle:', error);
    return response(500, { error: 'Internal server error' });
  }
};
