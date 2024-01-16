import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda"
import { Rekognition, DynamoDB } from 'aws-sdk';

const dbClient = new DynamoDB.DocumentClient()

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  console.log('\n\n', "EVENT", '\n\n');
  console.log('\n\n', event.body, '\n\n');
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello world',
    })
  }
}