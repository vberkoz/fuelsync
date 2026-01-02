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
        SK: 'SETTINGS'
      }
    }));

    if (!result.Item) {
      const defaultSettings = {
        PK: `USER#${userId}`,
        SK: 'SETTINGS',
        units: 'imperial',
        dateFormat: 'MM/DD/YYYY',
        notifications: true,
        preferredCurrency: 'USD',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: defaultSettings
      }));
      
      return response(200, { settings: defaultSettings });
    }

    return response(200, { settings: result.Item });
  } catch (error) {
    console.error('Error getting settings:', error);
    return response(500, { error: 'Internal server error' });
  }
};
