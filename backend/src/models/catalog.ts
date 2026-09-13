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
};

export type ShowtimeRecord = {
  id: string;
  movieSlug: string;
  cinema: string;
  room: string;
  startsAt: string;
  priceBase: number;
  closed: boolean;
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

export type BookingRecord = {
  id: string;
  code: string;
  movieSlug: string;
  showtimeId: string;
  seats: string[];
  status: BookingStatus;
  total: number;
  userEmail: string | null;
  createdAt: string;
  holdExpiresAt?: string | null;
};
