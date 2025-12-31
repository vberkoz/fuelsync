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

    const vehicleId = event.pathParameters?.id;
    if (!vehicleId) {
      return response(400, { error: 'Vehicle ID required' });
    }

    const [refillsResult, expensesResult] = await Promise.all([
      docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `VEHICLE#${vehicleId}`,
          ':sk': 'REFILL#'
        }
      })),
      docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `VEHICLE#${vehicleId}`,
          ':sk': 'EXPENSE#'
        }
      }))
    ]);

    const refills = refillsResult.Items || [];
    const expenses = expensesResult.Items || [];

    const totalRefills = refills.length;
    const totalExpenses = expenses.length;
    const totalFuelCost = refills.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const totalExpenseCost = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalVolume = refills.reduce((sum, r) => sum + (r.volume || 0), 0);
    const avgPricePerUnit = totalRefills > 0 ? totalFuelCost / totalVolume : 0;
    const avgRefillCost = totalRefills > 0 ? totalFuelCost / totalRefills : 0;
    const avgExpenseCost = totalExpenses > 0 ? totalExpenseCost / totalExpenses : 0;

    return response(200, {
      refills: {
        count: totalRefills,
        totalCost: totalFuelCost,
        totalVolume,
        avgPricePerUnit,
        avgCost: avgRefillCost
      },
      expenses: {
        count: totalExpenses,
        totalCost: totalExpenseCost,
        avgCost: avgExpenseCost
      },
      totals: {
        allCosts: totalFuelCost + totalExpenseCost
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return response(500, { error: 'Internal server error' });
  }
};
