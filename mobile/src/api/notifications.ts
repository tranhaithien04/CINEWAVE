import { api } from './client';
import { NotificationItem } from '../types';

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await api<{ notifications: NotificationItem[] }>('/notifications');
  return res.notifications;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await api('/notifications/read-all', { method: 'POST' });
}
