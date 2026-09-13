import type { AdminBooking } from "@/api/admin";

import { api } from "./client";

export function fetchMyTickets() {
  return api<{ tickets: AdminBooking[] }>("/tickets");
}

export function fetchMyTicket(code: string) {
  return api<{ ticket: AdminBooking }>(`/tickets/${encodeURIComponent(code)}`);
}
