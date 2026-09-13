"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationStreamUrl,
  type AppNotification,
} from "@/api/notifications";
import { showAppNotificationToast } from "@/components/layout/live-notification-toast";
import { useAuth } from "@/hooks/use-auth";

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được thông báo");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const source = new EventSource(notificationStreamUrl(), { withCredentials: true });
    source.onmessage = (event) => {
      try {
        const note = JSON.parse(event.data) as AppNotification;
        setNotifications((current) => [note, ...current.filter((item) => item.id !== note.id)]);
        showAppNotificationToast(note);
      } catch {
        /* ignore malformed frames */
      }
    };
    return () => source.close();
  }, [user]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((item) => !item.readAt).length,
      loading,
      error,
      refresh,
      async markRead(id: string) {
        try {
          const data = await markNotificationRead(id);
          setNotifications((current) => current.map((item) => (item.id === id ? data.notification : item)));
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Không đánh dấu được thông báo");
        }
      },
      async markAllRead() {
        try {
          const data = await markAllNotificationsRead();
          setNotifications(data.notifications);
          toast.success("Đã đánh dấu tất cả là đã đọc");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Không đánh dấu được thông báo");
        }
      },
    }),
    [error, loading, notifications, refresh],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
}
