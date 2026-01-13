import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { successResponse, errorResponse } from '../../utils/response';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { key } = JSON.parse(event.body || '{}');

    if (!key) {
      return errorResponse(400, 'Missing required field: key');
    }

    const command = new GetObjectCommand({
      Bucket: process.env.UPLOADS_BUCKET_NAME!,
      Key: key
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return successResponse({ url });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return errorResponse(500, error.message || 'Failed to generate URL');
  }
};
