import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

const DEFAULT_CATEGORIES = [
  'Other', 'Accessories', 'Parts', 'Loan', 'License', 'Parking',
  'Registration', 'Service', 'Insurance', 'Fines', 'Wash', 'Tax',
  'Maintenance', 'Repair', 'Tolls'
];

export const handler = async (event: any) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'CATEGORY#'
      }
    }));

    const customCategories = (result.Items || []).map(item => item.name);
    const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

    return successResponse({ categories: allCategories });
  } catch (error: any) {
    console.error('Error listing categories:', error);
    return errorResponse(error.message, 500);
  }
};
