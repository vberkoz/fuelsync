import { APIGatewayProxyHandler } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../../utils/dynamodb';
import { response } from '../../utils/response';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return response(401, { error: 'Unauthorized' });

    const { vehicleId, title, type, threshold, unit } = JSON.parse(event.body || '{}');
    if (!vehicleId || !title || !type || !threshold || !unit) {
      return response(400, { error: 'Missing required fields' });
    }

    const reminderId = `reminder_${Date.now()}`;
    const reminder = {
      PK: `USER#${userId}`,
      SK: `REMINDER#${reminderId}`,
      reminderId,
      vehicleId,
      userId,
      title,
      type,
      threshold: Number(threshold),
      unit,
      createdAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: reminder
    }));

    return response(201, { reminder });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return response(500, { error: 'Internal server error' });
  }
};
