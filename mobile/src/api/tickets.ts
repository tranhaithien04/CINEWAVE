import { api } from './client';
import { AdminBooking } from '../types';
import { mockTickets } from '../data/mock-data';

export async function fetchMyTickets(): Promise<AdminBooking[]> {
  try {
    const res = await api<{ tickets: AdminBooking[] }>('/tickets/my');
    return res.tickets;
  } catch {
    return mockTickets;
  }
}

export async function fetchMyTicket(code: string): Promise<AdminBooking | null> {
  try {
    const res = await api<{ ticket: AdminBooking }>(`/tickets/${code}`);
    return res.ticket;
  } catch {
    return mockTickets.find((t) => t.code === code) || null;
  }
}

