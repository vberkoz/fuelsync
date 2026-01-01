import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DeleteCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
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
      return response(400, { error: 'Vehicle ID is required' });
    }

    // Delete vehicle record
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `VEHICLE#${vehicleId}`
      },
      ConditionExpression: 'attribute_exists(PK)'
    }));

    // Query all refills and expenses for this vehicle
    const items: any[] = [];
    let lastKey: any = undefined;
    
    do {
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `VEHICLE#${vehicleId}`
        },
        ExclusiveStartKey: lastKey
      }));
      
      if (result.Items) {
        items.push(...result.Items);
      }
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    // Batch delete in chunks of 25 (DynamoDB limit)
    for (let i = 0; i < items.length; i += 25) {
      const chunk = items.slice(i, i + 25);
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: chunk.map(item => ({
            DeleteRequest: {
              Key: { PK: item.PK, SK: item.SK }
            }
          }))
        }
      }));
    }

    return response(200, { message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return response(404, { error: 'Vehicle not found' });
    }
    console.error('Error deleting vehicle:', error);
    return response(500, { error: 'Internal server error' });
  }
};
