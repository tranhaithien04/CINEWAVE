import type { NextFunction, Request, Response } from "express";

import { DomainError } from "../models/errors.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof DomainError) {
    res.status(err.status).json({ code: err.code, message: err.message });
    return;
  }

  if (typeof err === "object" && err && "type" in err && (err as { type?: string }).type === "entity.parse.failed") {
    res.status(400).json({ code: "VALIDATION_ERROR", message: "JSON không hợp lệ" });
    return;
  }

  console.error(err);
  res.status(500).json({ code: "INTERNAL_ERROR", message: "Internal server error" });
}
