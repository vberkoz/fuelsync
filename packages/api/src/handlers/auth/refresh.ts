import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { successResponse, errorResponse } from '../../utils/response';

const cognito = new CognitoIdentityProviderClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { refreshToken } = body;

    if (!refreshToken) {
      return errorResponse(400, 'Refresh token is required');
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: process.env.USER_POOL_CLIENT_ID!,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken
      }
    });

    const result = await cognito.send(command);

    return successResponse({
      accessToken: result.AuthenticationResult?.AccessToken,
      idToken: result.AuthenticationResult?.IdToken,
      expiresIn: result.AuthenticationResult?.ExpiresIn
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return errorResponse(401, error.message || 'Token refresh failed');
  }
};
