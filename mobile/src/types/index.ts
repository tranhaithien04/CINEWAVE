export type AgeRating = 'P' | 'K' | 'T13' | 'T16' | 'T18';

export const AGE_RATINGS: AgeRating[] = ['P', 'K', 'T13', 'T16', 'T18'];

export type Movie = {
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
  director?: string | null;
  actors?: string | null;
  imdbRating?: number | null;
  imdbVotes?: number | null;
  year?: string | null;
  tmdbId?: number | null;
};

export type Showtime = {
  id: string;
  movieSlug: string;
  cinema: string;
  room: string;
  startsAt: string;
  priceBase: number;
  closed?: boolean;
};

export type SeatType = 'STANDARD' | 'VIP' | 'COUPLE';

export type SeatStatus = 'AVAILABLE' | 'HELD' | 'SOLD';

export type Seat = {
  id: string;
  row: string;
  number: number;
  type: SeatType;
  status: SeatStatus;
  heldUntil?: string | null;
};

export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
};

export type BookingStatus =
  | 'DRAFT'
  | 'HELD'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'VOIDED'
  | 'USED';

export type AdminBooking = {
  id: string;
  code: string;
  userEmail: string | null;
  movieSlug: string;
  showtimeId: string;
  seats: string[];
  total: number;
  status: BookingStatus;
  createdAt: string;
  holdExpiresAt?: string | null;
};

export type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
  emailSentAt?: string | null;
};

export type AgeVerificationResult = {
  passed: boolean;
  requiredAge: number;
  computedAge: number | null;
  confidence: number;
  verificationId: string;
  idMasked: string | null;
  message: string;
  reasons?: string[];
  rawImageDeleted?: boolean;
};

