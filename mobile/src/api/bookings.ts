import { api } from './client';
import { AdminBooking } from '../types';

export type Booking = AdminBooking & {
  holdExpiresAt?: string | null;
  paymentCode?: string | null;
  paymentExpiresAt?: string | null;
  paymentProvider?: 'SEPAY' | 'MOCK' | null;
};

export function holdSeats(body: {
  showtimeId: string;
  movieSlug: string;
  seats: string[];
  total: number;
}) {
  return api<{ booking: Booking }>('/bookings/hold', {
    method: 'POST',
    body,
  });
}

export function fetchBooking(id: string) {
  return api<{ booking: Booking }>(`/bookings/${id}`);
}

export function updateBookingConcessions(id: string, items: Array<{ id: string; qty: number }>) {
  return api<{ booking: Booking }>(`/bookings/${id}/concessions`, {
    method: 'PATCH',
    body: { items },
  });
}
