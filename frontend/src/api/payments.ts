import type { AdminBooking } from "@/api/admin";

import { api } from "./client";

export function confirmPayment(body: {
  bookingId: string;
  showtimeId?: string;
  movieSlug?: string;
  seats?: string[];
  total?: number;
}) {
  return api<{ booking: AdminBooking }>("/payments/confirm", { method: "POST", body });
}
