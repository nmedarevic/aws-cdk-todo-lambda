import { createClient } from "@libsql/client";
import { DBClient, DBClientDependencies } from "./dbClient";

export class TursoDBClient extends DBClient {
  private client;

  constructor(private dependencies: DBClientDependencies) {
    super(dependencies);

    if (
      !this.dependencies.databaseUrl ||
      !this.dependencies.databaseAccessKey
    ) {
      throw new Error("Missing databaseUrl or databaseAccessKey");
    }

    this.client = createClient({
      url: this.dependencies.databaseUrl,
      authToken: this.dependencies.databaseAccessKey,
    });
  }

  async saveItem<T extends Object>(item: T) {
    const result = await this.client.execute({
      sql: "INSERT INTO Todo (id, text, created_at, updated_at, user_id) VALUES (?, ?, ?, ?, ?)",
      args: Object.values(item),
    });

    console.log(JSON.stringify(result));
  }
}
