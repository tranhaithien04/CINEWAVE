"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";
import { Clapperboard, CreditCard, Film, Ticket, Users } from "lucide-react";

import { fetchAdminOverview, fetchAdminRevenue, type AdminOverview, type RevenueReport } from "@/api/admin";
import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCatalog } from "@/hooks/use-catalog";
import { formatVnd } from "@/data/mock-catalog";

export function AdminPage() {
  const { movies, showtimes } = useCatalog();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAdminOverview(), fetchAdminRevenue()])
      .then(([nextOverview, nextRevenue]) => {
        if (cancelled) return;
        setOverview(nextOverview);
        setRevenue(nextRevenue);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Không tải được dashboard");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    { label: "Phim Catalog", value: overview?.movies ?? movies.length, icon: Film, money: false, color: "from-cyan-500 to-blue-600", border: "border-cyan-500/20" },
    { label: "Suất Chiếu", value: overview?.showtimes ?? showtimes.length, icon: Clapperboard, money: false, color: "from-blue-500 to-indigo-600", border: "border-blue-500/20" },
    { label: "Vé / Đơn Hàng", value: overview?.tickets ?? 0, icon: Ticket, money: false, color: "from-amber-500 to-orange-600", border: "border-amber-500/20" },
    { label: "Người Dùng", value: overview?.users ?? 0, icon: Users, money: false, color: "from-emerald-500 to-teal-600", border: "border-emerald-500/20" },
    { label: "Tổng Doanh Thu", value: overview?.revenue ?? revenue?.total ?? 0, icon: CreditCard, money: true, color: "from-fuchsia-500 to-pink-600", border: "border-fuchsia-500/20" },
  ];

  const maxRevenue = Math.max(1, ...(revenue?.byMovie.map((r) => r.total) ?? [1]));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live System
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Tổng quan hiệu suất bán vé, phòng chiếu và người dùng.</p>
        </div>
        {error ? <p className="text-sm font-medium text-rose-300">{error}</p> : null}
      </div>

      {/* 5 Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => (
          <Card
            key={item.label}
            className={`relative overflow-hidden rounded-2xl border ${item.border} bg-white/[0.02] backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10`}
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.color}`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </CardTitle>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
                <item.icon className="h-4 w-4 text-cyan-400" strokeWidth={2} />
              </div>
            </CardHeader>
            <CardContent className="font-display text-2xl font-bold tracking-tight text-white">
              {item.money ? (
                <NumberFlow
                  value={item.value}
                  locales="vi-VN"
                  format={{ style: "currency", currency: "VND", maximumFractionDigits: 0 }}
                />
              ) : (
                <NumberFlow value={item.value} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2 Detailed Panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Phim trên web */}
        <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-white">Phim trên hệ thống</CardTitle>
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                {movies.length} Phim
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="group flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.01] p-2.5 transition-colors hover:border-cyan-500/30 hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded-md border border-white/10 bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{movie.title}</p>
                    <p className="text-xs text-muted-foreground">{movie.durationMin} phút · {movie.genres.slice(0, 2).join(", ")}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 rounded-full text-[11px] font-semibold ${
                    movie.nowShowing
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {movie.nowShowing ? "Đang chiếu" : "Sắp chiếu"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Doanh thu theo phim */}
        <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-white">Doanh thu theo phim</CardTitle>
              <span className="text-xs text-muted-foreground">Theo tổng giá vé</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {(revenue?.byMovie ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu thanh toán.</p>
            ) : (
              revenue?.byMovie.map((row) => {
                const movie = movies.find((m) => m.slug === row.movieSlug);
                const percent = Math.min(100, Math.round((row.total / maxRevenue) * 100));
                return (
                  <div key={row.movieSlug} className="space-y-1.5 rounded-xl border border-white/5 bg-white/[0.01] p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium text-white">{movie?.title ?? row.movieSlug}</span>
                      <span className="font-display font-semibold text-cyan-300">{formatVnd(row.total)}</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-[width] duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminPage;
