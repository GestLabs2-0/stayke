import cors from "cors";
import express, { type RequestHandler } from "express";
import morgan from "morgan";

export const middleWares: RequestHandler[] = [
  express.json(),
  express.urlencoded({ extended: true }),
  cors(),
  morgan("dev") as RequestHandler,
];
