import { DynamoDB } from 'aws-sdk'
import { DBClient, DBClientDependencies } from './dbClient'

const table = 'todo'

export class DynamoDBClient extends DBClient {
  private client

  constructor(private dependencies: DBClientDependencies) {
    super(dependencies)

    if (!this.dependencies.databaseUrl || !this.dependencies.region) {
      throw new Error('Missing databaseUrl or databaseAccessKey')
    }

    this.client = new DynamoDB.DocumentClient({
      region: this.dependencies.region,
      endpoint: this.dependencies.databaseUrl,
    })
  }

  async saveItem<T extends Object>(item: T) {
    await this.client
      .put({
        TableName: table,
        Item: item,
      } as unknown as DynamoDB.Types.PutItemInput)
      .promise()
  }
}
