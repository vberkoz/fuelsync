import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { successResponse, errorResponse } from '../../utils/response';

const cognito = new CognitoIdentityProviderClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, code } = body;

    if (!email || !code) {
      return errorResponse(400, 'Email and code are required');
    }

    const command = new ConfirmSignUpCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID!,
      Username: email,
      ConfirmationCode: code
    });

    await cognito.send(command);

    return successResponse({ message: 'Email confirmed successfully' });
  } catch (error: any) {
    console.error('Confirmation error:', error);
    return errorResponse(400, error.message || 'Confirmation failed');
  }
};
