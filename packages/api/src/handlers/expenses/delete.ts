import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../../utils/dynamodb';
import { response } from '../../utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const vehicleId = event.pathParameters?.id;
    const expenseId = event.pathParameters?.expenseId;
    if (!vehicleId || !expenseId) {
      return response(400, { error: 'Vehicle ID and Expense ID required' });
    }

    const queryResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `VEHICLE#${vehicleId}`,
        ':sk': 'EXPENSE#'
      }
    }));

    const item = queryResult.Items?.find(i => i.expenseId === expenseId);
    if (!item) {
      return response(404, { error: 'Expense not found' });
    }

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: item.PK,
        SK: item.SK
      }
    }));

    return response(200, { message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return response(500, { error: 'Internal server error' });
  }
};
