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

export type SeatState = 'AVAILABLE' | 'HELD' | 'SOLD' | 'BLOCKED' | 'MINE_HELD';

export type Seat = {
  id: string;
  row: string;
  number: number;
  type: SeatType;
  state: SeatState;
  heldUntil?: string | null;
};

export type ConcessionLine = {
  id: string;
  qty: number;
  name: string;
  unitPrice: number;
};

export type TicketQrPayload = { code: string; sig: string; text: string };

export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  emailVerified?: boolean;
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
  seatTotal?: number;
  concessionTotal?: number;
  concessions?: ConcessionLine[];
  paymentCode?: string | null;
  paymentExpiresAt?: string | null;
  paymentProvider?: 'SEPAY' | 'MOCK' | null;
  checkedInAt?: string | null;
  cancelledAt?: string | null;
  refundExpiresAt?: string | null;
  refundedAt?: string | null;
  canCancel?: boolean;
  canReschedule?: boolean;
  qr?: TicketQrPayload | null;
  refundQr?: TicketQrPayload | null;
};

export type ConcessionItem = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export type PaymentInfo = {
  provider: 'SEPAY' | 'MOCK';
  qrUrl: string;
  bank: string;
  bankLabel: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  content: string;
  expiresAt: string;
};

export type TicketInspectResult = {
  ticket: AdminBooking;
  validForEntry: boolean;
  validForRefund?: boolean;
  kind?: 'ticket' | 'refund';
  verdict: 'VALID' | 'USED' | 'UNPAID' | 'CANCELLED' | 'REFUND_PENDING' | 'REFUNDED';
  message: string;
  signed?: boolean;
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
  confidence: number | null;
  verificationId: string;
  idMasked: string | null;
  message: string;
  reasons?: string[];
  rawImageDeleted?: boolean;
};

