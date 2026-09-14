import type { Request, Response } from "express";

import * as ticketService from "../services/ticket.service.js";
import {
  cancelMyTicket,
  listRescheduleOptions,
  rescheduleMyTicket,
} from "../services/booking.service.js";
import { DomainError } from "../models/errors.js";

export async function listMine(req: Request, res: Response) {
  if (!req.userId) {
    throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  }
  res.json({ tickets: await ticketService.listMyTickets(req.userId) });
}

export async function getByCode(req: Request, res: Response) {
  if (!req.userId) {
    throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  }
  res.json({ ticket: await ticketService.getMyTicket(req.userId, String(req.params.code)) });
}

export async function inspect(req: Request, res: Response) {
  const code = typeof req.query.code === "string" ? req.query.code : String(req.params.code ?? "");
  const sig = typeof req.query.sig === "string" ? req.query.sig : "";
  const kind = req.query.kind === "refund" ? "refund" : undefined;
  res.json(await ticketService.inspectTicket(code, sig, { kind }));
}

export async function inspectAsStaff(req: Request, res: Response) {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const sig = typeof req.query.sig === "string" ? req.query.sig : "";
  const kind = req.query.kind === "refund" ? "refund" : undefined;
  res.json(await ticketService.inspectTicket(code, sig, { allowUnsigned: true, kind }));
}

export async function checkIn(req: Request, res: Response) {
  const body = (req.body ?? {}) as { sig?: string };
  res.json({
    ticket: await ticketService.checkInTicket(String(req.params.code), {
      sig: body.sig,
      requireSig: false,
    }),
  });
}

export async function refundPayout(req: Request, res: Response) {
  res.json({ ticket: await ticketService.confirmRefundPayout(String(req.params.code)) });
}

export async function cancel(req: Request, res: Response) {
  if (!req.userId) {
    throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  }
  await cancelMyTicket(req.userId, String(req.params.code));
  res.json({ ticket: await ticketService.getMyTicket(req.userId, String(req.params.code)) });
}

export async function rescheduleOptions(req: Request, res: Response) {
  if (!req.userId) {
    throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  }
  res.json(await listRescheduleOptions(req.userId, String(req.params.code)));
}

export async function reschedule(req: Request, res: Response) {
  if (!req.userId) {
    throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  }
  const body = (req.body ?? {}) as { showtimeId?: string; seats?: string[] };
  await rescheduleMyTicket(req.userId, String(req.params.code), body);
  res.json({ ticket: await ticketService.getMyTicket(req.userId, String(req.params.code)) });
}
