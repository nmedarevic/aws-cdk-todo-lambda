export interface DBClientDependencies {
  databaseUrl: string | undefined;
  databaseAccessKey: string | undefined;
  region?: string;
}

export class DBClient {
  private databaseUrl: string | undefined;
  private databaseAccessKey: string | undefined;

  constructor(dependencies: DBClientDependencies) {
    this.databaseUrl = dependencies.databaseUrl;
    this.databaseAccessKey = dependencies.databaseAccessKey;
  }

  async saveItem<T extends Object>(_: T) {
    throw new Error("Not implemented");
  }

  async getItem() {
    throw new Error("Not implemented");
  }

  async updateItem() {
    throw new Error("Not implemented");
  }

  async deleteItem() {
    throw new Error("Not implemented");
  }
}
