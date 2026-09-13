import { api, apiUrl } from "./client";

export type AppNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  bookingId: string | null;
  movieSlug: string | null;
  readAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
};

export type NotificationList = {
  notifications: AppNotification[];
  unreadCount: number;
};

export function fetchNotifications() {
  return api<NotificationList>("/notifications");
}

export function markNotificationRead(id: string) {
  return api<{ notification: AppNotification }>(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return api<NotificationList>("/notifications/read-all", { method: "POST" });
}

export function notificationStreamUrl() {
  return apiUrl("/notifications/stream");
}
