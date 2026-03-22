import { Router } from "express";

import { propertyRoutes } from "./property.routes.js";
import { userRoutes } from "./user.routes.js";

const apiRouter = Router();

apiRouter.get("/", (req, res) => {
  res.status(200).json({ message: "Ok", status: 200 });
});

apiRouter.use("/properties", propertyRoutes);
apiRouter.use("/users", userRoutes);

/** Master router mounted at /api/v1 */
export const routers: Router = Router().use("/api-v1", apiRouter);
