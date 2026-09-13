import type { Request, Response } from "express";

import { DomainError } from "../models/errors.js";
import { verifyAge } from "../services/age-verification.service.js";

export async function verify(req: Request, res: Response) {
  if (!req.userId) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  const result = await verifyAge(req.userId, (req.body ?? {}) as { passed?: boolean; rating?: string; movieSlug?: string });
  res.json(result);
}
