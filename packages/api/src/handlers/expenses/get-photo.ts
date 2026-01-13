import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { response } from '../../utils/response';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME!;
const UPLOADS_BUCKET = process.env.UPLOADS_BUCKET_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const vehicleId = event.pathParameters?.id;
    const expenseId = event.pathParameters?.expenseId;
    const userId = event.requestContext.authorizer?.claims?.sub;
    const photoType = event.queryStringParameters?.type || 'receipt';

    if (!vehicleId || !expenseId || !userId) {
      return response(400, { error: 'Missing required parameters' });
    }

    const getResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `VEHICLE#${vehicleId}`,
        ':sk': 'EXPENSE#'
      }
    }));

    const expense = getResult.Items?.find(item => item.expenseId === expenseId);

    if (!expense) {
      return response(404, { error: 'Expense not found' });
    }

    const vehicleResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `VEHICLE#${vehicleId}`
      }
    }));

    if (!vehicleResult.Item) {
      return response(403, { error: 'Access denied' });
    }

    const photoKeyMap = {
      receipt: expense.receiptImageKey,
      odometer: expense.odometerImageKey
    };

    const photoKey = photoKeyMap[photoType as keyof typeof photoKeyMap];
    
    if (!photoKey) {
      return response(404, { error: `No ${photoType} photo found for this expense` });
    }

    const command = new GetObjectCommand({
      Bucket: UPLOADS_BUCKET,
      Key: photoKey
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return response(200, { photoUrl: presignedUrl, photoType });
  } catch (error) {
    console.error('Error getting expense photo:', error);
    return response(500, { error: 'Internal server error' });
  }
};
