import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda"
import { DynamoDB } from 'aws-sdk';

function isRunningLocalLambda() {
  return process.env.AWS_SAM_LOCAL === 'true';
}

const dbClient = new DynamoDB.DocumentClient({
  region: 'eu-central-1',
  endpoint: 'http://localstack:4566',
})

const table = "todos"

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  console.log('\n\n', "EVENT", '\n\n');
  console.log('\n\n', event.queryStringParameters, '\n\n');

  if (event.queryStringParameters == null || typeof event.queryStringParameters.id === "undefined") {
    throw new Error("[Delete Todo Lambda] Missing id")
  }

  const todoId = event.queryStringParameters.id;

  try {
    const result = await dbClient.delete({
      TableName: table,
      Key: {
        id: todoId
      },
    } as DynamoDB.Types.GetItemInput).promise()

    if (result.$response.error) {
      throw new Error("[Delete Todo Lambda] Todo not found")
    }

    return {
      statusCode: 200,
      body: "true"
    }
  } catch (error) {
    console.error("[Delete Todo Lambda] Error while deleting todo", error);

    return {
      statusCode: 404,
      body: "Not found"
    }
  }
}