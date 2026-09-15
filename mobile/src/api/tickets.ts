import { api } from './client';
import { AdminBooking, Showtime, TicketInspectResult } from '../types';

export type PublicTicket = AdminBooking;

export async function fetchMyTickets(): Promise<AdminBooking[]> {
  const res = await api<{ tickets: AdminBooking[] }>('/tickets');
  return res.tickets;
}

export async function fetchMyTicket(code: string): Promise<AdminBooking> {
  const res = await api<{ ticket: AdminBooking }>(`/tickets/${encodeURIComponent(code)}`);
  return res.ticket;
}

export function inspectTicketAsStaff(code: string, sig?: string, kind?: 'ticket' | 'refund') {
  const query = new URLSearchParams({ code });
  if (sig) query.set('sig', sig);
  if (kind) query.set('kind', kind);
  return api<TicketInspectResult>(`/tickets/staff/inspect?${query.toString()}`);
}

export function checkInTicket(code: string, sig?: string) {
  return api<{ ticket: AdminBooking }>(`/tickets/${encodeURIComponent(code)}/check-in`, {
    method: 'POST',
    body: sig ? { sig } : {},
  });
}

export function payoutRefund(code: string) {
  return api<{ ticket: AdminBooking }>(`/tickets/${encodeURIComponent(code)}/refund-payout`, {
    method: 'POST',
  });
}

export function cancelMyTicket(code: string) {
  return api<{ ticket: AdminBooking }>(`/tickets/${encodeURIComponent(code)}/cancel`, {
    method: 'POST',
  });
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
    method: 'POST',
    body,
  });
}
