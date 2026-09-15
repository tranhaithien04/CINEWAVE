"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { paths } from "@/routes/paths";
import { cn } from "@/utils/cn";
import { formatDateTimeCompact } from "@/utils/datetime";

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead } = useNotifications();

  if (!user) return null;

  const latest = notifications.slice(0, 6);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl" aria-label="Thông báo">
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-cinema-950">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Thông báo</span>
          <Link href={paths.notifications} className="text-xs font-normal text-cyan-400 hover:underline">
            Xem tất cả
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {latest.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Chưa có thông báo.</p>
        ) : (
          latest.map((item) => (
            <DropdownMenuItem key={item.id} asChild className="cursor-pointer items-start gap-2 py-2">
              <Link
                href={item.href || paths.notifications}
                onClick={() => {
                  if (!item.readAt) void markRead(item.id);
                }}
              >
                <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", item.readAt ? "bg-white/15" : "bg-cyan-400")} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{item.body}</span>
                  <span className="mt-1 block text-[10px] text-gray-500">{formatDateTimeCompact(item.createdAt)}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
