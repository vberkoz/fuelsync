import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { response } from '../../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const { firstName, lastName } = JSON.parse(event.body || '{}');

    if (!firstName || !lastName) {
      return response(400, { error: 'First name and last name are required' });
    }

    const profile = {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      firstName,
      lastName,
      email: event.requestContext.authorizer?.claims?.email || '',
      updatedAt: Date.now()
    };

    await docClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME!,
      Item: profile
    }));

    return response(200, { profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return response(500, { error: 'Internal server error' });
  }
};