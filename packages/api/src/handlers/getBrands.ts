import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../utils/dynamodb';
import { successResponse, errorResponse } from '../utils/response';

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: 'CONFIG#BRANDS', SK: 'CONFIG#BRANDS' }
    }));

    return successResponse({ brands: result.Item?.brands || [] });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return errorResponse('Failed to fetch brands', 500);
  }
};
