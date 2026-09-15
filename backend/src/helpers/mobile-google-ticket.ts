import { randomBytes } from "node:crypto";

import type { PublicUser } from "../models/user.js";

type TicketPayload = {
  user: PublicUser;
  tokens: { accessToken: string; refreshToken: string };
  expiresAt: number;
};

const tickets = new Map<string, TicketPayload>();

const TTL_MS = 2 * 60 * 1000;

export function createMobileGoogleTicket(payload: Omit<TicketPayload, "expiresAt">) {
  const ticket = randomBytes(24).toString("hex");
  tickets.set(ticket, { ...payload, expiresAt: Date.now() + TTL_MS });
  return ticket;
}

export function consumeMobileGoogleTicket(ticketRaw: string): TicketPayload | null {
  const ticket = ticketRaw.trim();
  if (!ticket) return null;
  const entry = tickets.get(ticket);
  tickets.delete(ticket);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) return null;
  return entry;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tickets) {
    if (value.expiresAt < now) tickets.delete(key);
  }
}, 60_000).unref();
