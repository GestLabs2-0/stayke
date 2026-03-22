import { DataSource } from "typeorm";

import { databaseConfig } from "./databaseConfig.js";

export const AppDataSource = new DataSource({
  ...databaseConfig,
  logging: true,
  migrations: [],
});
