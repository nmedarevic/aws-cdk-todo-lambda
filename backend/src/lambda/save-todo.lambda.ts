import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda"
import { DynamoDB } from 'aws-sdk';
import { createClient } from "@libsql/client";
import { v4 as uuidv4 } from 'uuid';

const getBody = (event: APIGatewayProxyEvent) => {
  try {
    const bodyJson = JSON.parse(event.body || '{}')

    return bodyJson
  } catch (error) {
    return {}
  }
}

const dbClient = new DynamoDB.DocumentClient({
  region: 'eu-central-1',
  endpoint: 'http://localstack:4566',
})

const table = "todos"

type SaveTodoItemDTO = {
  id: string,
  text: string,
}

interface DBClientDependencies {
  databaseUrl: string | undefined;
  databaseAccessKey: string | undefined;
}

class DBClient {
  private databaseUrl: string | undefined;
  private databaseAccessKey: string | undefined;
  
  constructor(dependencies: DBClientDependencies) {
    this.databaseUrl = dependencies.databaseUrl;
    this.databaseAccessKey = dependencies.databaseAccessKey;
  }

  async saveItem(_: SaveTodoItemDTO) {
    throw new Error("Not implemented")
  }

  async getItem() {
    throw new Error("Not implemented")
  }
  
  async updateItem() {
    throw new Error("Not implemented")
  }

  async deleteItem() {
    throw new Error("Not implemented")
  }
}

class TursoDBClient extends DBClient {
  private client;

  constructor(private dependencies: DBClientDependencies) {
    super(dependencies)

    if (!this.dependencies.databaseUrl || !this.dependencies.databaseAccessKey) {
      throw new Error("Missing databaseUrl or databaseAccessKey")
    }
console.log('\n\n', "URL", this.dependencies.databaseUrl, process.env, '\n\n');
    this.client = createClient({
      url: this.dependencies.databaseUrl,
      authToken: this.dependencies.databaseAccessKey,
    });
  }

  async saveItem(item: SaveTodoItemDTO) {
    const result = await this.client.execute({
      sql: "INSERT INTO Todo (id, text, created_at, updated_at, user_id) VALUES (?, ?, ?, ?, ?)",
      args: [item.id, item.text, new Date(), new Date(), "user-id"],
    });

    console.log(JSON.stringify(result));
  }
}

const tursoDBClient = new TursoDBClient({ databaseUrl: process.env.DATABASE_URL, databaseAccessKey: process.env.DATABASE_WRITE_ACCESS_KEY });

const getLambdaHandler = ({ dbClient }: {dbClient: DBClient}) => {
  return async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    console.log('\n\n', "EVENT", '\n\n');
    console.log('\n\n', event.body, '\n\n');
    console.log('\n\n', process.env, '\n\n');
    // console.log('\n\n', process.env.DATABASE_URL, '\n\n');
  
    const bodyJson = getBody(event)
    
    const item = {
      id: "b10025b5-cd54-4818-a50b-8331bca0a7ce", //,uuidv4(),
      text: bodyJson.text,
    }
  
    console.log('\n\n', "Item", item, '\n\n');
  
    try {
      await dbClient.saveItem(item)

      console.log('\n\n', "SAVED AN ITEM", '\n\n');
      // await dbClient.put({
      //   TableName: table,
      //   Item: item
      // } as DynamoDB.Types.PutItemInput).promise()
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
}

export const handler = getLambdaHandler({ dbClient: tursoDBClient})