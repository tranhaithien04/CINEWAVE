export const AGE_RATINGS = ["P", "K", "T13", "T16", "T18"] as const;
export type AgeRating = (typeof AGE_RATINGS)[number];

export type MovieRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationMin: number;
  rating: AgeRating;
  posterUrl: string;
  backdropUrl: string;
  genres: string[];
  nowShowing: boolean;
  trailerUrl?: string;
  imdbId?: string;
  tmdbId?: number;
  imdbRating?: number;
  imdbVotes?: number;
  year?: string;
  director?: string;
  actors?: string;
};

export type ShowtimeRecord = {
  id: string;
  movieSlug: string;
  cinema: string;
  room: string;
  startsAt: string;
  priceBase: number;
  closed: boolean;
  /** Ghế không mở bán (lối đi, hỏng…) — lưu trên suất trong Mongo */
  blockedSeats?: string[];
};

export type BookingStatus =
  | "HELD"
  | "PENDING_PAYMENT"
  | "PAID"
  | "USED"
  | "CANCELLED"
  | "REFUNDED"
  | "EXPIRED"
  | "VOIDED";

export type ConcessionLine = {
  id: string;
  qty: number;
  name: string;
  unitPrice: number;
};

export type BookingRecord = {
  id: string;
  code: string;
  movieSlug: string;
  showtimeId: string;
  seats: string[];
  status: BookingStatus;
  total: number;
  seatTotal?: number;
  concessionTotal?: number;
  concessions?: ConcessionLine[];
  userEmail: string | null;
  createdAt: string;
  holdExpiresAt?: string | null;
  paymentProvider?: "SEPAY" | "MOCK" | null;
  paymentCode?: string | null;
  paymentExpiresAt?: string | null;
  sepayTransactionId?: string | null;
  paidAt?: string | null;
  checkedInAt?: string | null;
  cancelledAt?: string | null;
  refundExpiresAt?: string | null;
  refundedAt?: string | null;
};
