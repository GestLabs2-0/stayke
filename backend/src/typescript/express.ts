import type { Request, Response } from "express";
import type { ParamsDictionary, Send } from "express-serve-static-core";
export interface RequestValidatedAPI<
  T = unknown,
  P extends ParamsDictionary = ParamsDictionary
> extends RequestValidationAPI<T, P> {
  body: T;
}

export interface RequestValidationAPI<
  T = unknown,
  P extends ParamsDictionary = ParamsDictionary
> extends Request {
  body: T | undefined;
  params: P;
}

export type ResponseAPI<T = unknown> = TypedResponse<{
  data?: T;
  errors?: Record<string /* field */, string /* error message */>;
  message: string;
  status: boolean;
}>;

export interface TypedResponse<ResBody> extends Response {
  json: Send<ResBody, this>;
}
