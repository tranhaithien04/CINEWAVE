"use client";

import Link from "next/link";

import { EmptyState, ErrorState } from "@/components/shared/state-views";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { paths } from "@/routes/paths";
import { cn } from "@/utils/cn";

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { notifications, loading, error, refresh, markRead, markAllRead, unreadCount } = useNotifications();

  if (authLoading) {
    return (
      <main className="mx-auto max-w-3xl space-y-3 px-4 py-12">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <EmptyState title="Cần đăng nhập" description="Đăng nhập để xem thông báo giữ ghế, thanh toán và suất chiếu." />
        <Button asChild>
          <Link href={paths.loginNext(paths.notifications)}>Đăng nhập</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400">Inbox</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Thông báo</h1>
        </div>
        {unreadCount > 0 ? (
          <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
            Đánh dấu đã đọc
          </Button>
        ) : null}
      </div>

      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : null}

      {error ? <ErrorState message={error} onRetry={() => void refresh()} /> : null}

      {!loading && !error && notifications.length === 0 ? (
        <EmptyState title="Chưa có thông báo" description="Khi giữ ghế, thanh toán hoặc admin xử lý đơn, thông báo sẽ hiện tại đây." />
      ) : null}

      <div className="space-y-3">
        {notifications.map((item) => (
          <Link
            key={item.id}
            href={item.href || paths.notifications}
            onClick={() => {
              if (!item.readAt) void markRead(item.id);
            }}
            className={cn(
              "block rounded-2xl border p-4 transition-colors hover:border-cyan-500/40",
              item.readAt ? "border-white/10 bg-cinema-900/40" : "border-cyan-500/25 bg-cyan-500/5",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{item.title}</p>
                <p className="mt-1 text-sm text-gray-400">{item.body}</p>
              </div>
              {!item.readAt ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" /> : null}
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              {timeLabel(item.createdAt)}
              {item.emailSentAt ? " · Đã gửi email" : ""}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default NotificationsPage;

