import { Response } from "express";

export function responseAndLogger(
  res: Response,
  message: string,
  status = 500,
  data?: null | object | object[],
) {
  const isSuccess = status < 400;

  if (status >= 500) {
    console.error(`${message} (${String(status)})`);
  } else {
    console.log(`${message} (${String(status)})`);
  }

  if (data) {
    res.status(status).json({ data, message, status: isSuccess });
  } else {
    res.status(status).json({ message, status: isSuccess });
  }
}
