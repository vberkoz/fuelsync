import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../../utils/dynamodb';
import { response } from '../../utils/response';
import { randomUUID } from 'crypto';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const vehicleId = randomUUID();
    const timestamp = new Date().toISOString();

    const vehicle = {
      PK: `USER#${userId}`,
      SK: `VEHICLE#${vehicleId}`,
      vehicleId,
      userId,
      make: body.make,
      model: body.model,
      year: body.year,
      vin: body.vin,
      licensePlate: body.licensePlate,
      fuelType: body.fuelType,
      tankCapacity: body.tankCapacity,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: vehicle
    }));

    return response(201, { vehicle });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return response(500, { error: 'Internal server error' });
  }
};
