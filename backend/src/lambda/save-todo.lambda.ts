import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda"
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dbClient = new DynamoDB.DocumentClient({
  region: 'eu-central-1',
  endpoint: 'http://localstack:4566',
})

const table = "todos"

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  console.log('\n\n', "EVENT", '\n\n');
  console.log('\n\n', event.body, '\n\n');
  const bodyJson = JSON.parse(event.body || '{}')
  
  const item = {
    id: uuidv4(),
    text: bodyJson.text,
  }

  console.log('\n\n', "Item", item, '\n\n');

  try {
    await dbClient.put({
      TableName: table,
      Item: item
    } as DynamoDB.Types.PutItemInput).promise()
  } catch (error) {
    console.log('\n\n', "Error", error, '\n\n');

    return {
      statusCode: 500,
      body: JSON.stringify(error)
    }
  }

  console.log('\n\n', "Finished inserting", '\n\n');

  return {
    statusCode: 200,
    body: JSON.stringify(item)
  }
}