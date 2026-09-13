import type { AdminBooking } from "@/api/admin";

import { api } from "./client";

export type Booking = AdminBooking & {
  holdExpiresAt?: string | null;
};

export function holdSeats(body: {
  showtimeId: string;
  movieSlug: string;
  seats: string[];
  total: number;
}) {
  return api<{ booking: Booking }>("/bookings/hold", { method: "POST", body });
}

export function fetchBooking(id: string) {
  return api<{ booking: Booking }>(`/bookings/${id}`);
}
