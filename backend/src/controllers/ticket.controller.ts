import type { Request, Response } from "express";

import * as ticketService from "../services/ticket.service.js";
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
