"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Clapperboard, Film, LayoutDashboard, Ticket, Users, Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/state-views";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { paths } from "@/routes/paths";
import { cn } from "@/utils/cn";

const nav = [
  { href: paths.admin, label: "Tổng quan", icon: LayoutDashboard },
  { href: paths.adminMovies, label: "Phim", icon: Film },
  { href: paths.adminShowtimes, label: "Suất chiếu", icon: Clapperboard },
  { href: paths.adminBookings, label: "Đơn hàng", icon: Wallet },
  { href: paths.adminTickets, label: "Vé", icon: Ticket },
  { href: paths.adminUsers, label: "Người dùng", icon: Users },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(paths.loginNext(pathname || paths.admin));
    }
  }, [loading, pathname, router, user]);

  if (loading || (!user && !loading)) {
    return (
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-40 w-full bg-white/5" />
      </main>
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <EmptyState
          title="Không có quyền truy cập"
          description="Trang quản trị chỉ dành cho tài khoản role ADMIN."
        />
      </main>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 md:flex-row md:py-10">
      <aside className="shrink-0 md:w-64">
        <div className="sticky top-24 space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl">
          {/* Cyber Header */}
          <div className="border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400">
                CYBER CORE // ADMIN OS
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Trung tâm điều hành CineWave</p>
          </div>

          {/* Navigation */}
          <nav className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative inline-flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-[background-color,color,transform] duration-200",
                    active
                      ? "border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/10"
                      : "border border-transparent text-gray-400 hover:border-white/10 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-transform group-hover:scale-110",
                      active ? "text-cyan-400" : "text-gray-500 group-hover:text-cyan-300",
                    )}
                    strokeWidth={active ? 2.2 : 1.75}
                  />
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] md:block" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Admin User Info */}
          <div className="hidden border-t border-white/5 pt-4 md:block">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 font-display text-xs font-bold text-white shadow-md shadow-cyan-500/20">
                {user.fullName ? user.fullName[0].toUpperCase() : "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white">{user.fullName || "Quản Trị Viên"}</p>
                <span className="inline-flex items-center rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-rose-300">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default AdminShell;
