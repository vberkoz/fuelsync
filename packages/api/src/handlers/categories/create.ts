import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: any) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const { name } = JSON.parse(event.body);

    if (!name || name.trim().length === 0) {
      return errorResponse('Category name is required', 400);
    }

    const categoryId = `CATEGORY#${Date.now()}`;
    
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: categoryId,
        name: name.trim(),
        createdAt: new Date().toISOString()
      }
    }));

    return successResponse({ category: name.trim() });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return errorResponse(error.message, 500);
  }
};
