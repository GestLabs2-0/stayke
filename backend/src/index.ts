import "reflect-metadata";

import { PORT } from "../constants.js";
import { AppDataSource } from "./database/appDataSource.js";
import { middleWares } from "./middlewares/index.js";
import { routers } from "./routes/index.js";
import { Server } from "./server.js";

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");

    const port = Number(PORT);

    const server = new Server({
      enable404Handler: true,
      mainRoute: true,
      middleWares,
      port,
      routes: [routers],
    });

    server.listen();
    console.log("Running successfully");
  })
  .catch((err: unknown) => {
    console.error("Error during Data Source initialization:", err);
  });
