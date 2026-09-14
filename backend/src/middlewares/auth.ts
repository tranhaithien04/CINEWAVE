import type { NextFunction, Request, Response } from "express";

import { ACCESS_COOKIE } from "../helpers/cookies.js";
import { verifyAccessToken } from "../helpers/jwt.js";
import { DomainError } from "../models/errors.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
  const token = bearerToken || (req.cookies?.[ACCESS_COOKIE] as string | undefined);
  if (!token) {
    next(new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    next(new DomainError("TOKEN_EXPIRED", "Access token hết hạn", 401));
  }
}

export function requireRole(...roles: Array<"CUSTOMER" | "STAFF" | "ADMIN">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userId || !req.userRole || !roles.includes(req.userRole)) {
      next(new DomainError("FORBIDDEN", "Không có quyền truy cập", 403));
      return;
    }
    next();
  };
}
