import {   APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult, } from "aws-lambda";

export async function handler(
  _: APIGatewayProxyEvent,
  __: Context
): Promise<APIGatewayProxyResult> {
  console.log('\n\n', "Oauth lambda", '\n\n');

  return {
    body: "HELLO WORLD",
    statusCode: 200
  }
}