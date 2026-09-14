"use client";

import { useEffect, useState } from "react";
import NumberFlow from "@number-flow/react";

import { fetchAdminRevenue, type RevenueReport } from "@/api/admin";
import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVnd } from "@/data/mock-catalog";
import { useCatalog } from "@/hooks/use-catalog";

export function AdminReportsPage() {
  const { movies } = useCatalog();
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminRevenue()
      .then((data) => {
        if (!cancelled) setRevenue(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Không tải được báo cáo");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxMovie = Math.max(1, ...(revenue?.byMovie.map((r) => r.total) ?? [1]));
  const maxCinema = Math.max(1, ...(revenue?.byCinema?.map((r) => r.total) ?? [1]));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Báo cáo doanh thu</h1>
          <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            {revenue?.paidCount ?? 0} đơn đã thu
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Tách vé ghế / F&B và theo phim, theo rạp.</p>
        {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Tổng doanh thu", value: revenue?.total ?? 0 },
          { label: "Doanh thu ghế", value: revenue?.seatRevenue ?? 0 },
          { label: "Doanh thu F&B", value: revenue?.concessionRevenue ?? 0 },
        ].map((item) => (
          <Card key={item.label} className="rounded-2xl border-white/10 bg-white/[0.02]">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="font-display text-2xl font-bold text-cyan-300">
              <NumberFlow
                value={item.value}
                locales="vi-VN"
                format={{ style: "currency", currency: "VND", maximumFractionDigits: 0 }}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-white/10 bg-white/[0.02]">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-base text-white">Theo phim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {(revenue?.byMovie ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            ) : (
              revenue?.byMovie.map((row) => {
                const movie = movies.find((m) => m.slug === row.movieSlug);
                const percent = Math.round((row.total / maxMovie) * 100);
                return (
                  <div key={row.movieSlug} className="space-y-1.5 rounded-xl border border-white/5 p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">{movie?.title ?? row.movieSlug}</span>
                      <span className="font-display text-cyan-300">{formatVnd(row.total)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-white/10 bg-white/[0.02]">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-base text-white">Theo rạp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {(revenue?.byCinema ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            ) : (
              revenue?.byCinema?.map((row) => {
                const percent = Math.round((row.total / maxCinema) * 100);
                return (
                  <div key={row.cinema} className="space-y-1.5 rounded-xl border border-white/5 p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">{row.cinema}</span>
                      <span className="font-display text-cyan-300">{formatVnd(row.total)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" style={{ width: `${percent}%` }} />
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

export default AdminReportsPage;
