import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { successResponse, errorResponse } from '../../utils/response';
import { parseOdometer, parsePumpDisplay, parseReceipt } from './parsers';
import { randomUUID } from 'crypto';

const textract = new TextractClient({ region: process.env.AWS_REGION || 'us-east-1' });
const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const enhanceWithNova = async (rawText: string, scanType: string, lastOdometer?: number) => {
  const prompts: Record<string, string> = {
    odometer: lastOdometer 
      ? `Find the TOTAL odometer reading (not trip distance) in this text. It should be a 5-6 digit number greater than ${lastOdometer}. Ignore smaller numbers (trip distance). Return JSON with {"odometer": number}.`
      : 'Extract the TOTAL odometer reading (5-6 digit number, not trip distance) from this text. Ignore smaller 2-3 digit numbers. Return JSON with {"odometer": number}.',
    pump: 'Extract volume (number), pricePerUnit (number), and totalCost (number) from this fuel pump display',
    receipt: 'Extract date, volume, totalCost, and stationName from this receipt'
  };

  const command = new InvokeModelCommand({
    modelId: 'amazon.nova-micro-v1:0',
    body: JSON.stringify({
      messages: [{
        role: 'user',
        content: `${prompts[scanType]}: ${rawText}\nReturn only valid JSON with extracted values.`
      }],
      inferenceConfig: {
        max_new_tokens: 150,
        temperature: 0
      }
    })
  });

  const response = await bedrock.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return JSON.parse(result.output.message.content[0].text);
};

const uploadImageToS3 = async (imageData: string, scanType: string, userId: string) => {
  const imageBuffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const key = `ocr/${userId}/${scanType}/${randomUUID()}.jpg`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.UPLOADS_BUCKET_NAME!,
    Key: key,
    Body: imageBuffer,
    ContentType: 'image/jpeg'
  }));
  
  return key;
};

const parseTextractResult = (result: any, scanType: string) => {
  const text = result.Blocks
    ?.filter((block: any) => block.BlockType === 'LINE')
    .map((block: any) => block.Text)
    .join(' ') || '';
    
  switch (scanType) {
    case 'odometer':
      return parseOdometer(text);
    case 'pump':
      return parsePumpDisplay(text);
    case 'receipt':
      return parseReceipt(text);
    default:
      return { confidence: 0, values: {} };
  }
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { image, scanType, lastOdometer } = body;
    const userId = event.requestContext.authorizer?.claims?.sub;

    if (!image || !scanType || !userId) {
      return errorResponse(400, 'Missing required fields: image, scanType');
    }

    const imageBytes = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    // Step 1: Textract extracts raw text
    const command = new AnalyzeDocumentCommand({
      Document: { Bytes: imageBytes },
      FeatureTypes: ['TABLES', 'FORMS']
    });

    const textractResult = await textract.send(command);
    const rawText = textractResult.Blocks
      ?.filter((block: any) => block.BlockType === 'LINE')
      .map((block: any) => block.Text)
      .join(' ') || '';

    // Step 2: Nova Micro intelligently parses
    let extractedData;
    let usedFallback = false;
    try {
      extractedData = await enhanceWithNova(rawText, scanType, lastOdometer);
    } catch (novaError) {
      // Fallback to regex parsing if Nova fails
      console.log('Nova parsing failed, using regex fallback');
      const fallback = parseTextractResult(textractResult, scanType);
      extractedData = fallback.values;
      usedFallback = true;
    }

    // Step 3: Validate odometer if lastOdometer provided
    if (scanType === 'odometer' && lastOdometer && extractedData.odometer) {
      if (extractedData.odometer <= lastOdometer) {
        extractedData.odometer = lastOdometer;
        extractedData.validationWarning = 'Recognized value was not greater than last odometer';
      }
    }

    // Step 4: Upload image to S3
    const imageKey = await uploadImageToS3(image, scanType, userId);

    return successResponse({
      confidence: usedFallback ? 0.7 : 0.95,
      data: extractedData,
      imageKey,
      source: usedFallback ? 'textract+regex' : 'textract+nova'
    });
  } catch (error: any) {
    console.error('OCR extraction error:', error);
    return errorResponse(500, error.message || 'Failed to process OCR');
  }
};
