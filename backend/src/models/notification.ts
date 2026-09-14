export const NOTIFICATION_TYPES = [
  "HOLD_EXPIRING",
  "PAYMENT_SUCCESS",
  "SHOWTIME_REMINDER",
  "AGE_VERIFIED",
  "AGE_FAILED",
  "BOOKING_CANCELLED",
  "BOOKING_REFUNDED",
  "TICKET_CHECKED_IN",
  "REFUND_READY",
  "ADMIN_BROADCAST",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationRecord = {
  id: string;
  userId: string;
  userEmail: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  bookingId: string | null;
  movieSlug: string | null;
  readAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
};

export type PublicNotification = Omit<NotificationRecord, "userEmail">;
