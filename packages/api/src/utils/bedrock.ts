import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BedrockRequest {
  messages: BedrockMessage[];
  max_tokens?: number;
  temperature?: number;
}

export const invokeNovaMicro = async (prompt: string, temperature = 0.3, maxTokens = 1000) => {
  const request = {
    messages: [{ 
      role: 'user', 
      content: [{ text: prompt }]
    }],
    inferenceConfig: {
      maxTokens,
      temperature
    }
  };

  const command = new InvokeModelCommand({
    modelId: 'amazon.nova-micro-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(request)
  });

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  return responseBody.output.message.content[0].text;
};
