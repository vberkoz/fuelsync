export const response = (statusCode: number, body: any) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
  },
  body: JSON.stringify(body)
});

export const successResponse = (data: any) => response(200, data);

export const errorResponse = (statusCode: number, message: string) => 
  response(statusCode, { message });
