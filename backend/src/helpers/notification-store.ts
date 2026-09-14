import { NotificationModel } from "../db/models.js";
import { toPlain, toPlainList } from "../db/mongo.js";
import type { NotificationRecord, NotificationType } from "../models/notification.js";

export async function listNotificationsByUser(userId: string) {
  const docs = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return toPlainList<NotificationRecord>(docs);
}

export async function getNotificationById(id: string) {
  const doc = await NotificationModel.findOne({ id }).lean();
  return toPlain<NotificationRecord>(doc);
}

export async function hasNotification(userId: string, type: NotificationType, bookingId: string) {
  const count = await NotificationModel.countDocuments({ userId, type, bookingId });
  return count > 0;
}

export async function saveNotification(notification: NotificationRecord) {
  const doc = await NotificationModel.findOneAndUpdate({ id: notification.id }, notification, {
    new: true,
    upsert: true,
  }).lean();
  return toPlain<NotificationRecord>(doc)!;
}

export async function markNotificationRead(id: string, userId: string) {
  const item = await getNotificationById(id);
  if (!item || item.userId !== userId) return null;
  if (item.readAt) return item;
  return saveNotification({ ...item, readAt: new Date().toISOString() });
}

export async function markAllNotificationsRead(userId: string) {
  const now = new Date().toISOString();
  await NotificationModel.updateMany({ userId, readAt: null }, { readAt: now });
  return listNotificationsByUser(userId);
}

export async function ensureNotificationSeed(userId: string, userEmail: string) {
  const existing = await NotificationModel.countDocuments({ userId });
  if (existing) return;
  const now = Date.now();
  await NotificationModel.insertMany([
    {
      id: "nt-seed-1",
      userId,
      userEmail,
      type: "PAYMENT_SUCCESS",
      title: "Thanh toán thành công",
      body: "Vé CW-9F2K đã sẵn sàng. Kiểm tra hộp Vé của tôi để xem mã QR.",
      href: "/tickets/CW-9F2K",
      bookingId: "bk-1",
      movieSlug: "dao-hai-tac",
      readAt: new Date(now - 86_400_000).toISOString(),
      emailSentAt: new Date(now - 86_400_000).toISOString(),
      createdAt: new Date(now - 86_400_000).toISOString(),
    },
    {
      id: "nt-seed-2",
      userId,
      userEmail,
      type: "SHOWTIME_REMINDER",
      title: "Sắp tới giờ chiếu",
      body: "Suất Đảo Hải Tặc: Red sẽ bắt đầu trong khoảng 1 giờ. Hãy có mặt trước giờ chiếu.",
      href: "/tickets/CW-9F2K",
      bookingId: "bk-1",
      movieSlug: "dao-hai-tac",
      readAt: null,
      emailSentAt: null,
      createdAt: new Date(now - 3_600_000).toISOString(),
    },
  ] satisfies NotificationRecord[]);
}
