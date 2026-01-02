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
    const { units, dateFormat, notifications, language, preferredCurrency } = body;

    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = { ':updatedAt': Date.now() };
    const expressionAttributeNames: Record<string, string> = {};

    if (units !== undefined) {
      updateExpressions.push('units = :units');
      expressionAttributeValues[':units'] = units;
    }
    if (dateFormat !== undefined) {
      updateExpressions.push('dateFormat = :dateFormat');
      expressionAttributeValues[':dateFormat'] = dateFormat;
    }
    if (notifications !== undefined) {
      updateExpressions.push('notifications = :notifications');
      expressionAttributeValues[':notifications'] = notifications;
    }
    if (language !== undefined) {
      updateExpressions.push('#lang = :language');
      expressionAttributeValues[':language'] = language;
      expressionAttributeNames['#lang'] = 'language';
    }
    if (preferredCurrency !== undefined) {
      updateExpressions.push('preferredCurrency = :preferredCurrency');
      expressionAttributeValues[':preferredCurrency'] = preferredCurrency;
    }

    updateExpressions.push('updatedAt = :updatedAt');

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'SETTINGS'
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames }),
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return response(200, { settings: result.Attributes });
  } catch (error) {
    console.error('Error updating settings:', error);
    return response(500, { error: 'Internal server error' });
  }
};
