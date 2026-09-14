import type { Request, Response } from "express";

import { DomainError } from "../models/errors.js";
import {
  confirmMockPayment,
  createPaymentIntent,
  getPaymentStatus,
  handleSepayWebhook,
} from "../services/payment.service.js";
import type { SepayWebhookPayload } from "../helpers/sepay.js";

export async function webhook(req: Request, res: Response) {
  const result = await handleSepayWebhook(
    (req.body ?? {}) as SepayWebhookPayload,
    req.headers as Record<string, unknown>,
    req.rawBody,
  );
  res.status(200).json(result);
}

export async function intent(req: Request, res: Response) {
  if (!req.userId) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  const bookingId = String((req.body as { bookingId?: string } | undefined)?.bookingId ?? "");
  if (!bookingId) throw new DomainError("VALIDATION_ERROR", "Thiếu mã đơn");
  const data = await createPaymentIntent(req.userId, bookingId);
  res.json(data);
}

export async function status(req: Request, res: Response) {
  if (!req.userId) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  const data = await getPaymentStatus(req.userId, String(req.params.bookingId));
  res.json(data);
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
