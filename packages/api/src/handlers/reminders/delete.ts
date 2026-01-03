import { APIGatewayProxyHandler } from 'aws-lambda';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../../utils/dynamodb';
import { response } from '../../utils/response';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return response(401, { error: 'Unauthorized' });

    const reminderId = event.pathParameters?.reminderId;
    if (!reminderId) return response(400, { error: 'Missing reminderId' });

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `REMINDER#${reminderId}`
      }
    }));

    return response(200, { message: 'Reminder deleted' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return response(500, { error: 'Internal server error' });
  }
};
