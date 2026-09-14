import { api } from './client';
import { NotificationItem } from '../types';

const defaultNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'u1',
    type: 'BOOKING_PAID',
    title: 'Thanh toán vé thành công',
    body: 'Vé xem phim Đảo Hải Tặc: Red của bạn đã được xuất mã QR check-in tại rạp.',
    createdAt: new Date().toISOString(),
    readAt: null,
  },
  {
    id: 'notif-2',
    userId: 'u1',
    type: 'PROMO',
    title: 'Ưu đãi IMAX Laser Cyber',
    body: 'Giảm 20% combo bắp nước khi đặt vé suất chiếu cuối tuần.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    readAt: new Date().toISOString(),
  },
];

export async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const res = await api<{ notifications: NotificationItem[] }>('/notifications');
    return res.notifications;
  } catch {
    return defaultNotifications;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await api(`/notifications/${id}/read`, { method: 'PATCH' });
  } catch {
    // Ignore error
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    await api('/notifications/read-all', { method: 'POST' });
  } catch {
    // Ignore error
  }
}

