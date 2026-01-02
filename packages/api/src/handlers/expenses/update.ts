import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../../utils/dynamodb';
import { response } from '../../utils/response';
import { getExchangeRate } from '../../utils/exchange-rate';

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
      FilterExpression: 'expenseId = :expenseId',
      ExpressionAttributeValues: {
        ':pk': `VEHICLE#${vehicleId}`,
        ':sk': 'EXPENSE#',
        ':expenseId': expenseId
      },
      Limit: 1
    }));

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return response(404, { error: 'Expense not found' });
    }

    const existingExpense = queryResult.Items[0];
    const body = JSON.parse(event.body || '{}');
    const currency = body.currency || 'USD';
    
    const exchangeRate = await getExchangeRate(currency);
    const baseAmount = body.amount / exchangeRate;

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: existingExpense.PK,
        SK: existingExpense.SK
      },
      UpdateExpression: 'SET category = :category, amount = :amount, currency = :currency, exchangeRate = :exchangeRate, baseAmount = :baseAmount, odometer = :odometer, description = :description, taxDeductible = :taxDeductible',
      ExpressionAttributeValues: {
        ':category': body.category,
        ':amount': body.amount,
        ':currency': currency,
        ':exchangeRate': exchangeRate,
        ':baseAmount': baseAmount,
        ':odometer': body.odometer,
        ':description': body.description,
        ':taxDeductible': body.taxDeductible || false
      },
      ReturnValues: 'ALL_NEW'
    }));

    return response(200, { expense: result.Attributes });
  } catch (error) {
    console.error('Error updating expense:', error);
    return response(500, { error: 'Internal server error' });
  }
};
