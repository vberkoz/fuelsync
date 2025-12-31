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

    const vehiclesResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'VEHICLE#'
      }
    }));

    const vehicles = vehiclesResult.Items || [];
    const recentRefills: any[] = [];
    const recentExpenses: any[] = [];

    for (const vehicle of vehicles.slice(0, 3)) {
      const refillsResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `VEHICLE#${vehicle.vehicleId}`,
          ':sk': 'REFILL#'
        },
        ScanIndexForward: false,
        Limit: 5
      }));

      const expensesResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `VEHICLE#${vehicle.vehicleId}`,
          ':sk': 'EXPENSE#'
        },
        ScanIndexForward: false,
        Limit: 5
      }));

      recentRefills.push(...(refillsResult.Items || []));
      recentExpenses.push(...(expensesResult.Items || []));
    }

    recentRefills.sort((a, b) => b.timestamp - a.timestamp);
    recentExpenses.sort((a, b) => b.timestamp - a.timestamp);

    return response(200, {
      vehicleCount: vehicles.length,
      recentRefills: recentRefills.slice(0, 5),
      recentExpenses: recentExpenses.slice(0, 5)
    });
  } catch (error) {
    console.error('Error getting dashboard:', error);
    return response(500, { error: 'Internal server error' });
  }
};
