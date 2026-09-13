import type { Request, Response } from "express";

import { DomainError } from "../models/errors.js";
import { confirmMockPayment } from "../services/payment.service.js";

export function webhook(_req: Request, res: Response) {
  res.status(202).json({ ok: true });
}

export async function confirm(req: Request, res: Response) {
  if (!req.userId) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  const booking = await confirmMockPayment(req.userId, (req.body ?? {}) as {
    bookingId?: string;
    showtimeId?: string;
    movieSlug?: string;
    seats?: string[];
    total?: number;
  });
  res.json({ booking });
}
