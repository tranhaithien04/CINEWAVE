import { api } from './client';
import { AdminBooking, PaymentInfo } from '../types';

export type PaymentBooking = AdminBooking;

export function createPaymentIntent(bookingId: string) {
  return api<{ booking: PaymentBooking; payment: PaymentInfo }>('/payments/intent', {
    method: 'POST',
    body: { bookingId },
  });
}

export function fetchPaymentStatus(bookingId: string) {
  return api<{ booking: PaymentBooking; paid: boolean; payment: PaymentInfo | null }>(
    `/payments/${bookingId}`,
  );
}

export function confirmPayment(body: {
  bookingId: string;
  showtimeId?: string;
  movieSlug?: string;
  seats?: string[];
  total?: number;
}) {
  return api<{ booking: AdminBooking }>('/payments/confirm', { method: 'POST', body });
}
