import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, ResendConfirmationCodeCommand } from '@aws-sdk/client-cognito-identity-provider';
import { successResponse, errorResponse } from '../../utils/response';

const cognito = new CognitoIdentityProviderClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email } = body;

    if (!email) {
      return errorResponse(400, 'Email is required');
    }

    const command = new ResendConfirmationCodeCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID!,
      Username: email
    });

    await cognito.send(command);

    return successResponse({ message: 'Verification code sent to your email' });
  } catch (error: any) {
    console.error('Resend code error:', error);
    return errorResponse(400, error.message || 'Failed to resend code');
  }
};
