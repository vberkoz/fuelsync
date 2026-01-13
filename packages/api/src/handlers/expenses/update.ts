import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../../utils/dynamodb';
import { response } from '../../utils/response';
import { getExchangeRate } from '../../utils/exchange-rate';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Updated to support media field
  try {
    console.log('UPDATE EXPENSE - Event:', JSON.stringify(event, null, 2));
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

    console.log('Query result count:', queryResult.Items?.length);
    const expense = queryResult.Items?.find(item => item.expenseId === expenseId);
    console.log('Found expense:', expense ? 'yes' : 'no');

    if (!expense) {
      console.log('Expense not found');
      return response(404, { error: 'Expense not found' });
    }

    const existingExpense = expense;
    const body = JSON.parse(event.body || '{}');
    const currency = body.currency || 'USD';
    
    if (!body.odometer) {
      return response(400, { error: 'Odometer is required' });
    }
    
    const exchangeRate = await getExchangeRate(currency);
    const baseAmount = body.amount / exchangeRate;

    const updateExpressionParts = [
      'category = :category',
      'amount = :amount',
      'currency = :currency',
      'exchangeRate = :exchangeRate',
      'baseAmount = :baseAmount',
      'odometer = :odometer',
      'description = :description',
      'taxDeductible = :taxDeductible'
    ];
    
    const expressionAttributeValues: any = {
      ':category': body.category,
      ':amount': body.amount,
      ':currency': currency,
      ':exchangeRate': exchangeRate,
      ':baseAmount': baseAmount,
      ':odometer': body.odometer,
      ':description': body.description,
      ':taxDeductible': body.taxDeductible || false
    };
    
    if (body.odometerImageKey !== undefined) {
      updateExpressionParts.push('odometerImageKey = :odometerImageKey');
      expressionAttributeValues[':odometerImageKey'] = body.odometerImageKey;
    }
    
    if (body.receiptImageKey !== undefined) {
      updateExpressionParts.push('receiptImageKey = :receiptImageKey');
      expressionAttributeValues[':receiptImageKey'] = body.receiptImageKey;
    }
    
    if (body.media !== undefined) {
      updateExpressionParts.push('media = :media');
      expressionAttributeValues[':media'] = body.media;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: existingExpense.PK,
        SK: existingExpense.SK
      },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    // Update vehicle odometer
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `VEHICLE#${vehicleId}`
      },
      UpdateExpression: 'SET odometer = :odometer',
      ExpressionAttributeValues: {
        ':odometer': body.odometer
      }
    }));

    return response(200, { expense: result.Attributes });
  } catch (error) {
    console.error('Error updating expense:', error);
    return response(500, { error: 'Internal server error' });
  }
};
