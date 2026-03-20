import { type Express, Router } from "express";
import { authRoutes } from "./authRoutes";
export function routes(app: Express) {
  let router = Router();
  app.use("/api/v1", router.use("/auth", authRoutes()));
}
