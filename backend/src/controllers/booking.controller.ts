import type { Request, Response } from "express";

import { DomainError } from "../models/errors.js";
import { getMyBooking, holdSeats } from "../services/booking.service.js";

export async function hold(req: Request, res: Response) {
  if (!req.userId) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  const booking = await holdSeats(req.userId, (req.body ?? {}) as {
    showtimeId?: string;
    movieSlug?: string;
    seats?: string[];
    total?: number;
  });
  res.status(201).json({ booking });
}

export async function getOne(req: Request, res: Response) {
  if (!req.userId) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  const booking = await getMyBooking(req.userId, String(req.params.id));
  res.json({ booking });
}
