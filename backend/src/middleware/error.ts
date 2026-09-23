import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details !== undefined
        ? { details: err.details }
        : {}),
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.flatten(),
    });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({
    error: "Internal server error",
  });
}

export function notFoundHandler(
  req: Request,
  res: Response
) {
  console.warn(
    `[404] ${req.method} ${req.originalUrl}`
  );

  return res.status(404).json({
    error: "Route not found",
    method: req.method,
    path: req.originalUrl,
  });
}