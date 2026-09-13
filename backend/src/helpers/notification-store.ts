import type { NotificationRecord, NotificationType } from "../models/notification.js";
import { readJsonFile, writeJsonFile } from "./json-store.js";

const FILE = "notifications.json";

async function readAll() {
  return readJsonFile<NotificationRecord[]>(FILE, []);
}

export async function listNotificationsByUser(userId: string) {
  const items = await readAll();
  return items
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getNotificationById(id: string) {
  return (await readAll()).find((item) => item.id === id) ?? null;
}

export async function hasNotification(userId: string, type: NotificationType, bookingId: string) {
  const items = await readAll();
  return items.some((item) => item.userId === userId && item.type === type && item.bookingId === bookingId);
}

export async function saveNotification(notification: NotificationRecord) {
  const items = await readAll();
  const index = items.findIndex((item) => item.id === notification.id);
  if (index === -1) items.push(notification);
  else items[index] = notification;
  await writeJsonFile(FILE, items);
  return notification;
}

export async function markNotificationRead(id: string, userId: string) {
  const item = await getNotificationById(id);
  if (!item || item.userId !== userId) return null;
  if (item.readAt) return item;
  return saveNotification({ ...item, readAt: new Date().toISOString() });
}

export async function markAllNotificationsRead(userId: string) {
  const items = await readAll();
  const now = new Date().toISOString();
  let changed = false;
  const next = items.map((item) => {
    if (item.userId !== userId || item.readAt) return item;
    changed = true;
    return { ...item, readAt: now };
  });
  if (changed) await writeJsonFile(FILE, next);
  return next.filter((item) => item.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function ensureNotificationSeed(userId: string, userEmail: string) {
  const existing = await listNotificationsByUser(userId);
  if (existing.length) return;
  const now = Date.now();
  await writeJsonFile(FILE, [
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
