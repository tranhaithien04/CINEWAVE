export const DOMAIN_ERROR_CODES = [
  "VALIDATION_ERROR",
  "EMAIL_TAKEN",
  "INVALID_CREDENTIALS",
  "UNAUTHORIZED",
  "TOKEN_EXPIRED",
  "FORBIDDEN",
  "SEAT_TAKEN",
  "SEAT_BLOCKED",
  "INVALID_COUPLE_PAIR",
  "TOO_MANY_SEATS",
  "HOLD_EXPIRED",
  "SHOWTIME_CLOSED",
  "SHOWTIME_STARTED",
  "BOOKING_CUTOFF",
  "AGE_NOT_VERIFIED",
  "PAYMENT_PENDING",
  "PAYMENT_TIMEOUT",
  "CANCEL_NOT_ALLOWED",
  "ALREADY_CHECKED_IN",
  "FORBIDDEN_BOOKING",
  "NOT_FOUND",
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
