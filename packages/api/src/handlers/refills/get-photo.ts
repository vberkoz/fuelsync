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
    console.log('Photo request:', JSON.stringify({ pathParameters: event.pathParameters, queryStringParameters: event.queryStringParameters }));
    
    const vehicleId = event.pathParameters?.id;
    const refillId = event.pathParameters?.refillId;
    const userId = event.requestContext.authorizer?.claims?.sub;
    const photoType = event.queryStringParameters?.type || 'odometer'; // odometer, pump, receipt

    console.log('Extracted params:', { vehicleId, refillId, userId, photoType });

    if (!vehicleId || !refillId || !userId) {
      console.log('Missing required parameters');
      return response(400, { error: 'Missing required parameters' });
    }

    console.log('Querying refill with:', { vehicleId, refillId });
    
    // Query all refills for the vehicle and filter in code
    const getResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `VEHICLE#${vehicleId}`,
        ':sk': 'REFILL#'
      }
    }));

    console.log('Query result:', { itemCount: getResult.Items?.length });

    // Filter by refillId in code
    const refill = getResult.Items?.find(item => item.refillId === refillId);

    if (!refill) {
      console.log('Refill not found');
      return response(404, { error: 'Refill not found' });
    }

    console.log('Found refill:', { refillId: refill.refillId, photoKeys: { odometerImageKey: refill.odometerImageKey, pumpImageKey: refill.pumpImageKey, receiptImageKey: refill.receiptImageKey } });

    // Verify ownership through vehicle
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

    // Get the appropriate photo key based on type
    const photoKeyMap = {
      odometer: refill.odometerImageKey,
      pump: refill.pumpImageKey,
      receipt: refill.receiptImageKey
    };

    const photoKey = photoKeyMap[photoType as keyof typeof photoKeyMap];
    console.log('Photo key for type', photoType, ':', photoKey);
    
    if (!photoKey) {
      console.log(`No ${photoType} photo found`);
      return response(404, { error: `No ${photoType} photo found for this refill` });
    }

    // Generate presigned URL (expires in 1 hour)
    const command = new GetObjectCommand({
      Bucket: UPLOADS_BUCKET,
      Key: photoKey
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return response(200, { photoUrl: presignedUrl, photoType });
  } catch (error) {
    console.error('Error getting refill photo:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return response(500, { error: 'Internal server error' });
  }
};