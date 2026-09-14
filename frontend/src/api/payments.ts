import type { AdminBooking } from "@/api/admin";

import { api } from "./client";

export type PaymentInfo = {
  provider: "SEPAY" | "MOCK";
  qrUrl: string;
  bank: string;
  bankLabel: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  content: string;
  expiresAt: string;
};

export type PaymentBooking = AdminBooking & {
  holdExpiresAt?: string | null;
  paymentCode?: string | null;
  paymentExpiresAt?: string | null;
  paymentProvider?: "SEPAY" | "MOCK" | null;
};

export function createPaymentIntent(bookingId: string) {
  return api<{ booking: PaymentBooking; payment: PaymentInfo }>("/payments/intent", {
    method: "POST",
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
  return api<{ booking: AdminBooking }>("/payments/confirm", { method: "POST", body });
}
