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
    throw new Error("Missing id")
  }

  const todoId = event.queryStringParameters.id;

  try {
    const result = await dbClient.get({
      TableName: table,
      Key: {
        id: todoId
      },
    } as DynamoDB.Types.GetItemInput).promise()

    if (!result.Item) {
      throw new Error("Todo not found")
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item)
    }
  } catch (error) {
    console.error("Error while getting todo", error);

    return {
      statusCode: 404,
      body: "Not found"
    }
  }
}