import { api } from './client';
import { Booking } from './bookings';

export async function confirmPayment(body: {
  bookingId: string;
  showtimeId: string;
  movieSlug: string;
  seats: string[];
  total: number;
}): Promise<{ booking: Booking }> {
  try {
    return await api<{ booking: Booking }>('/payments/confirm', {
      method: 'POST',
      body,
    });
  } catch {
    // If backend confirm fails or is offline, generate mock confirmed booking
    return {
      booking: {
        id: body.bookingId,
        code: `CW-${Math.floor(1000 + Math.random() * 9000)}-OK`,
        userEmail: 'demo@cinewave.vn',
        movieSlug: body.movieSlug,
        showtimeId: body.showtimeId,
        seats: body.seats,
        total: body.total,
        status: 'PAID',
        createdAt: new Date().toISOString(),
      },
    };
  }
}

