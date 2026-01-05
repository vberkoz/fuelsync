import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { response } from '../../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const result = await docClient.send(new GetCommand({
      TableName: process.env.TABLE_NAME!,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE'
      }
    }));

    const profile = result.Item || {
      firstName: '',
      lastName: '',
      email: event.requestContext.authorizer?.claims?.email || '',
      // Try to get names from Cognito claims if not in profile
      ...(event.requestContext.authorizer?.claims?.given_name && {
        firstName: event.requestContext.authorizer.claims.given_name
      }),
      ...(event.requestContext.authorizer?.claims?.family_name && {
        lastName: event.requestContext.authorizer.claims.family_name
      })
    };

    return response(200, { profile });
  } catch (error) {
    console.error('Error getting profile:', error);
    return response(500, { error: 'Internal server error' });
  }
};