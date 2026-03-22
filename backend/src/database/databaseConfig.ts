import type { DataSourceOptions } from "typeorm";

import * as path from "path";
import { fileURLToPath } from "url";

import { DB } from "../../constants.js";

const __filename = fileURLToPath(import.meta.url);

// __dirname = .../src/database  →  entities live at .../src/database/entities
const __dirname = path.dirname(__filename);

// In dev (tsx) entities are .ts; in production build (dist/) they are .js
const isDevelopment = __dirname.includes("/src/");
const ext = isDevelopment ? "ts" : "js";

// Correct path: src/database/entities/**  (NOT src/entities/**)
const entities = [path.join(__dirname, `./entities/**/*.${ext}`)];

export const databaseConfig: DataSourceOptions = {
  database: DB.database,
  entities,
  host: DB.host,
  logging: true,
  password: DB.password,
  port: DB.port,
  /**
   * synchronize: true → TypeORM auto-creates/updates tables on initialize().
   * Use ONLY in development. For production, use migrations.
   */
  synchronize: isDevelopment,
  type: "postgres",
  username: DB.user,
};
