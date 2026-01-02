import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../utils/dynamodb';
import { successResponse, errorResponse } from '../../utils/response';

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const vehicleId = event.pathParameters?.id;
    const userId = event.requestContext.authorizer?.claims?.sub;

    if (!vehicleId || !userId) {
      return errorResponse(400, 'Missing vehicleId or userId');
    }

    const [refillsResult, expensesResult] = await Promise.all([
      docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `VEHICLE#${vehicleId}`,
          ':sk': 'REFILL#'
        },
        ScanIndexForward: false
      })),
      docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `VEHICLE#${vehicleId}`,
          ':sk': 'EXPENSE#'
        },
        ScanIndexForward: false
      }))
    ]);

    const monthlyData: Record<string, { fuel: number; expenses: number; volume: number }> = {};

    refillsResult.Items?.forEach((item: any) => {
      const date = new Date(item.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { fuel: 0, expenses: 0, volume: 0 };
      monthlyData[monthKey].fuel += item.baseAmount || item.totalCost || 0;
      monthlyData[monthKey].volume += item.volume || 0;
    });

    expensesResult.Items?.forEach((item: any) => {
      const date = new Date(item.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { fuel: 0, expenses: 0, volume: 0 };
      monthlyData[monthKey].expenses += item.baseAmount || item.amount || 0;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(m => {
      const [year, month] = m.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    return successResponse({
      fuelConsumption: {
        labels,
        data: sortedMonths.map(m => monthlyData[m].volume)
      },
      costs: {
        labels,
        fuel: sortedMonths.map(m => monthlyData[m].fuel),
        expenses: sortedMonths.map(m => monthlyData[m].expenses)
      }
    });
  } catch (error) {
    console.error('Error fetching charts:', error);
    return errorResponse(500, 'Failed to fetch charts');
  }
};
