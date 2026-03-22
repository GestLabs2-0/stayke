import { verifyEnvVariable } from "./src/utils/verifyEnvVariable.js";

export const ADMIN_SECRET = verifyEnvVariable("ADMIN_SECRET");


export const PORT = verifyEnvVariable("PORT");

export const DB = {
  database: verifyEnvVariable("DB_NAME"),
  host: verifyEnvVariable("DB_HOST"),
  password: verifyEnvVariable("DB_PASSWORD"),
  port: Number.parseInt(verifyEnvVariable("DB_PORT")),
  user: verifyEnvVariable("DB_USERNAME"),
};
