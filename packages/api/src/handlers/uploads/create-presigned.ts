import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { response } from '../../utils/response';
import { randomUUID } from 'crypto';

const s3 = new S3Client({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const { fileType, mediaType } = JSON.parse(event.body || '{}');

    if (!fileType || !mediaType) {
      return response(400, { error: 'fileType and mediaType required' });
    }

    const fileId = randomUUID();
    const key = `expenses/${userId}/${mediaType}/${fileId}`;

    const command = new PutObjectCommand({
      Bucket: process.env.UPLOADS_BUCKET_NAME!,
      Key: key,
      ContentType: fileType
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return response(200, { uploadUrl, key });
  } catch (error) {
    console.error('Error creating presigned URL:', error);
    return response(500, { error: 'Internal server error' });
  }
};
