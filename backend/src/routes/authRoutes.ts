import { Router } from "express";
export function authRoutes() {
  let router = Router();
  router.post("/login", (req, res) => {
    res.send("Login route");
  });
  router.post("/register", (req, res) => {
    res.send("Register route");
  });
  return router;
}
