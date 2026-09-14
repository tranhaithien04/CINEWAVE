import type { Request, Response } from "express";

import { DomainError } from "../models/errors.js";
import { verifyAgeFromUpload } from "../services/age-verification.service.js";

export async function verify(req: Request, res: Response) {
  if (!req.userId) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  const file = req.file;
  if (!file) {
    throw new DomainError("VALIDATION_ERROR", "Vui lòng tải ảnh mặt trước CCCD");
  }
  const body = req.body as {
    rating?: string;
    movieSlug?: string;
    bookingId?: string;
    showtimeId?: string;
  };
  const result = await verifyAgeFromUpload(req.userId, {
    file,
    rating: typeof body.rating === "string" ? body.rating : undefined,
    movieSlug: typeof body.movieSlug === "string" ? body.movieSlug : undefined,
    bookingId: typeof body.bookingId === "string" ? body.bookingId : undefined,
    showtimeId: typeof body.showtimeId === "string" ? body.showtimeId : undefined,
  });
  res.json(result);
}
