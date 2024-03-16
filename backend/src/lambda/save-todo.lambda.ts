import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda"

import { v4 as uuidv4 } from 'uuid';
import { DBClient } from "../db/dbClient";
import { TursoDBClient } from "../db/tursoDbClient";

const getBody = (event: APIGatewayProxyEvent) => {
  try {
    const bodyJson = JSON.parse(event.body || '{}')

    return bodyJson
  } catch (error) {
    return {}
  }
}

type SaveTodoItemDTO = {
  id: string,
  text: string,
  created_at: Date,
  updated_at: Date,
  user_id: string,
}

const tursoDBClient = new TursoDBClient({ databaseUrl: process.env.DATABASE_URL, databaseAccessKey: process.env.DATABASE_WRITE_ACCESS_KEY });

const getLambdaHandler = ({ dbClient }: {dbClient: DBClient}) => {
  return async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const bodyJson = getBody(event)
    
    const item: SaveTodoItemDTO = {
      id: uuidv4(),
      text: bodyJson.text,
      created_at: new Date(),
      updated_at: new Date(),
      user_id: bodyJson.user_id || uuidv4(),
    }
  
    try {
      await dbClient.saveItem(item)
    } catch (error) {
      console.log('\n\n', "Could not save a todo", error, '\n\n');
  
      return {
        statusCode: 500,
        body: JSON.stringify(error)
      }
    }
  
    console.log('\n\n', "Todo inserted", '\n\n');
  
    return {
      statusCode: 200,
      body: JSON.stringify(item)
    }
  }
}

export const handler = getLambdaHandler({ dbClient: tursoDBClient})