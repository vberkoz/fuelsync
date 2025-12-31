import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../../utils/dynamodb';
import { successResponse, errorResponse } from '../../utils/response';

const cognito = new CognitoIdentityProviderClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password, givenName, familyName } = body;

    if (!email || !password) {
      return errorResponse(400, 'Email and password are required');
    }

    const command = new SignUpCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID!,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        ...(givenName ? [{ Name: 'given_name', Value: givenName }] : []),
        ...(familyName ? [{ Name: 'family_name', Value: familyName }] : [])
      ]
    });

    const result = await cognito.send(command);

    if (result.UserSub) {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${result.UserSub}`,
          SK: 'PROFILE',
          email,
          name: givenName && familyName ? `${givenName} ${familyName}` : givenName || '',
          currency: 'USD',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      }));
    }

    return successResponse({
      userSub: result.UserSub,
      userConfirmed: result.UserConfirmed,
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return errorResponse(400, error.message || 'Registration failed');
  }
};
