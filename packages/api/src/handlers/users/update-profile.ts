import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../../utils/dynamodb';
import { response } from '../../utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { name } = body;

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE'
      },
      UpdateExpression: 'SET #name = :name, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': name,
        ':updatedAt': Date.now()
      },
      ReturnValues: 'ALL_NEW'
    }));

    return response(200, { profile: result.Attributes });
  } catch (error) {
    console.error('Error updating profile:', error);
    return response(500, { error: 'Internal server error' });
  }
};
