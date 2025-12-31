import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../../utils/dynamodb';
import { response } from '../../utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE'
      }
    }));

    if (!result.Item) {
      const email = event.requestContext.authorizer?.claims?.email || '';
      const newProfile = {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
        email,
        name: '',
        currency: 'USD',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: newProfile
      }));
      
      return response(200, { profile: newProfile });
    }

    return response(200, { profile: result.Item });
  } catch (error) {
    console.error('Error getting profile:', error);
    return response(500, { error: 'Internal server error' });
  }
};
