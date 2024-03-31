import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'

const getBody = (event: APIGatewayProxyEvent) => {
  try {
    const bodyJson = JSON.parse(event.body || '{}')

    return bodyJson
  } catch (error) {
    return {}
  }
}

function isRunningLocalLambda() {
  return process.env.AWS_SAM_LOCAL === 'true'
}

const dbClient = new DynamoDB.DocumentClient({
  region: 'eu-central-1',
  endpoint: 'http://localstack:4566',
})

const table = 'todos'

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log('\n\n', 'EVENT', '\n\n')
  console.log('\n\n', event.body, '\n\n')

  const body = getBody(event)

  if (typeof body.id === 'undefined') {
    throw new Error('Missing id')
  }

  try {
    const result = await dbClient
      .update({
        TableName: table,
        Key: {
          id: body.id,
        },
        UpdateExpression: 'SET #ts = :val1',
        ExpressionAttributeValues: {
          ':val1': body.text,
        },
        ExpressionAttributeNames: {
          '#ts': 'text',
        },
      } as DynamoDB.Types.UpdateItemInput)
      .promise()

    if (result.$response.error) {
      throw new Error('Todo not found')
    }

    return {
      statusCode: 200,
      body: 'true',
    }
  } catch (error) {
    console.error('Error while updating a todo', error)

    return {
      statusCode: 404,
      body: 'Not found',
    }
  }
}
