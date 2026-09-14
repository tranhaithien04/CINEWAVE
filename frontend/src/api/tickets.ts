import type { AdminBooking } from "@/api/admin";
import type { Showtime } from "@/@types/movie";

import { api } from "./client";

export type TicketQr = { code: string; sig: string; text: string };

export type PublicTicket = AdminBooking;

export function fetchMyTickets() {
  return api<{ tickets: PublicTicket[] }>("/tickets");
}

export function fetchMyTicket(code: string) {
  return api<{ ticket: PublicTicket }>(`/tickets/${encodeURIComponent(code)}`);
}

export type TicketInspectResult = {
  ticket: PublicTicket;
  validForEntry: boolean;
  validForRefund?: boolean;
  kind?: "ticket" | "refund";
  verdict: "VALID" | "USED" | "UNPAID" | "CANCELLED" | "REFUND_PENDING" | "REFUNDED";
  message: string;
  signed?: boolean;
};

export function inspectTicket(code: string, sig: string, kind?: "ticket" | "refund") {
  const query = new URLSearchParams({ code, sig });
  if (kind) query.set("kind", kind);
  return api<TicketInspectResult>(`/tickets/inspect?${query.toString()}`);
}

export function inspectTicketAsStaff(code: string, sig?: string, kind?: "ticket" | "refund") {
  const query = new URLSearchParams({ code });
  if (sig) query.set("sig", sig);
  if (kind) query.set("kind", kind);
  return api<TicketInspectResult>(`/tickets/staff/inspect?${query.toString()}`);
}

export function checkInTicket(code: string, sig?: string) {
  return api<{ ticket: PublicTicket }>(`/tickets/${encodeURIComponent(code)}/check-in`, {
    method: "POST",
    body: sig ? { sig } : {},
  });
}

export function payoutRefund(code: string) {
  return api<{ ticket: PublicTicket }>(`/tickets/${encodeURIComponent(code)}/refund-payout`, {
    method: "POST",
  });
}

export function cancelMyTicket(code: string) {
  return api<{ ticket: PublicTicket }>(`/tickets/${encodeURIComponent(code)}/cancel`, { method: "POST" });
}

export function fetchRescheduleOptions(code: string) {
  return api<{
    booking: PublicTicket;
    current: Showtime;
    showtimes: Showtime[];
  }>(`/tickets/${encodeURIComponent(code)}/reschedule-options`);
}

export function rescheduleMyTicket(code: string, body: { showtimeId: string; seats: string[] }) {
  return api<{ ticket: PublicTicket }>(`/tickets/${encodeURIComponent(code)}/reschedule`, {
    method: "POST",
    body,
  });
}
