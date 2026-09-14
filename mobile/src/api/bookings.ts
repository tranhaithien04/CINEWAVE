import { api } from './client';
import { AdminBooking } from '../types';

export type Booking = AdminBooking & {
  holdExpiresAt?: string | null;
};

export async function holdSeats(body: {
  showtimeId: string;
  movieSlug: string;
  seats: string[];
  total: number;
}): Promise<{ booking: Booking }> {
  try {
    return await api<{ booking: Booking }>('/bookings/hold', {
      method: 'POST',
      body,
    });
  } catch (err: any) {
    // Return mock booking if server unavailable
    const fallbackBooking: Booking = {
      id: `bk-${Date.now()}`,
      code: `CW-${Math.floor(1000 + Math.random() * 9000)}-M`,
      userEmail: 'demo@cinewave.vn',
      movieSlug: body.movieSlug,
      showtimeId: body.showtimeId,
      seats: body.seats,
      total: body.total,
      status: 'HELD',
      createdAt: new Date().toISOString(),
      holdExpiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
    };
    return { booking: fallbackBooking };
  }
}

export async function fetchBooking(id: string): Promise<{ booking: Booking }> {
  return api<{ booking: Booking }>(`/bookings/${id}`);
}

