import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, ChangePasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { response } from '../../utils/response';

const cognitoClient = new CognitoIdentityProviderClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const accessToken = event.headers.Authorization?.replace('Bearer ', '');
    if (!accessToken) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return response(400, { error: 'Old password and new password are required' });
    }

    await cognitoClient.send(new ChangePasswordCommand({
      AccessToken: accessToken,
      PreviousPassword: oldPassword,
      ProposedPassword: newPassword
    }));

    return response(200, { message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Error changing password:', error);
    if (error.name === 'NotAuthorizedException') {
      return response(401, { error: 'Current password is incorrect' });
    }
    return response(500, { error: 'Failed to change password' });
  }
};
