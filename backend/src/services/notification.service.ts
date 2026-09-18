import { randomUUID } from "node:crypto";

import { sendMail } from "../helpers/mailer.js";
import {
  hasNotification,
  listNotificationsByUser,
  markAllNotificationsRead,
  markNotificationRead,
  saveNotification,
} from "../helpers/notification-store.js";
import { emitUserNotification } from "../helpers/notify-hub.js";
import { findUserByEmail, findUserById } from "../helpers/user-store.js";
import { DomainError } from "../models/errors.js";
import type { NotificationRecord, NotificationType, PublicNotification } from "../models/notification.js";

export type NotifyInput = {
  userId?: string;
  userEmail?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  bookingId?: string | null;
  movieSlug?: string | null;
  dedupe?: boolean;
  sendEmail?: boolean;
};

export function toPublicNotification(item: NotificationRecord): PublicNotification {
  const { userEmail: _email, ...rest } = item;
  return rest;
}

export async function listMyNotifications(userId: string) {
  const items = await listNotificationsByUser(userId);
  return {
    notifications: items.map(toPublicNotification),
    unreadCount: items.filter((item) => !item.readAt).length,
  };
}

export async function readNotification(userId: string, id: string) {
  const item = await markNotificationRead(id, userId);
  if (!item) throw new DomainError("NOT_FOUND", "Không tìm thấy thông báo", 404);
  return toPublicNotification(item);
}

export async function readAllNotifications(userId: string) {
  const items = await markAllNotificationsRead(userId);
  return {
    notifications: items.map(toPublicNotification),
    unreadCount: 0,
  };
}

export async function notifyUser(input: NotifyInput) {
  const user = input.userId
    ? await findUserById(input.userId)
    : input.userEmail
      ? await findUserByEmail(input.userEmail)
      : null;
  if (!user) return null;

  if (input.dedupe !== false && input.bookingId && (await hasNotification(user.id, input.type, input.bookingId))) {
    return null;
  }

  const record: NotificationRecord = {
    id: randomUUID(),
    userId: user.id,
    userEmail: user.email,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    bookingId: input.bookingId ?? null,
    movieSlug: input.movieSlug ?? null,
    readAt: null,
    emailSentAt: null,
    createdAt: new Date().toISOString(),
  };

  // Persist + push realtime first so callers (esp. gate check-in) are not blocked by SMTP.
  await saveNotification(record);
  const publicNote = toPublicNotification(record);
  emitUserNotification(user.id, publicNote);

  if (input.sendEmail !== false) {
    void sendMail({ to: user.email, subject: `[CINEWAVE] ${record.title}`, text: record.body })
      .then(async (result) => {
        if (!result.sent || result.transport === "console-fallback") return;
        record.emailSentAt = new Date().toISOString();
        await saveNotification(record);
      })
      .catch((error) => {
        console.error("Không gửi được email thông báo", error);
      });
  }

  return publicNote;
}
