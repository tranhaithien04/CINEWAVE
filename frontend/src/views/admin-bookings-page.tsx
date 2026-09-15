"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { cancelAdminBooking, fetchAdminBookings, refundAdminBooking, type AdminBooking } from "@/api/admin";
import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVnd } from "@/data/mock-catalog";
import { useCatalog } from "@/hooks/use-catalog";

export function AdminBookingsPage() {
  const { getMovieBySlug } = useCatalog();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAdminBookings();
      setBookings(data.bookings);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được đơn");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(booking: AdminBooking) {
    try {
      await cancelAdminBooking(booking.id);
      toast.success("Đã hủy đơn");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không hủy được");
    }
  }

  async function refund(booking: AdminBooking) {
    try {
      await refundAdminBooking(booking.id);
      toast.success("Đã hoàn tiền");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không hoàn được");
    }
  }

  const [search, setSearch] = useState("");

  const filteredBookings = bookings.filter(
    (b) =>
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      (b.userEmail ?? "").toLowerCase().includes(search.toLowerCase()) ||
      b.movieSlug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">Quản lý đơn hàng</h1>
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              {bookings.length} Đơn
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi giao dịch, hủy vé hoặc hoàn tiền cho khách.</p>
        </div>
      </div>

      <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-white">
              Lịch sử giao dịch ({filteredBookings.length})
            </CardTitle>
            <div className="w-full sm:w-64">
              <input
                type="text"
                aria-label="Tìm mã đơn hoặc email"
                placeholder="Tìm mã đơn hoặc email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-white/5 pt-2">
          {error ? <p className="py-4 text-sm text-rose-300">{error}</p> : null}
          {filteredBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Không có đơn hàng nào.</p>
          ) : (
            filteredBookings.map((booking) => {
              const movie = getMovieBySlug(booking.movieSlug);
              const canCancel =
                booking.status !== "USED" &&
                booking.status !== "CANCELLED" &&
                booking.status !== "REFUNDED";
              const canRefund = booking.status === "PAID" || booking.status === "VOIDED";

              const statusColor =
                booking.status === "PAID"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : booking.status === "USED"
                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                  : booking.status === "REFUNDED"
                  ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                  : booking.status === "CANCELLED"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300";

              return (
                <div
                  key={booking.id}
                  className="group flex flex-wrap items-center justify-between gap-4 py-3.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300">{booking.code}</span>
                      <span className="text-gray-500">·</span>
                      <p className="font-medium text-white group-hover:text-cyan-200 transition-colors truncate">
                        {movie?.title ?? booking.movieSlug}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{booking.userEmail ?? "Khách vãng lai"}</span>
                      <span>•</span>
                      <div className="flex gap-1">
                        {booking.seats.map((seat) => (
                          <span
                            key={seat}
                            className="rounded bg-white/5 px-1.5 py-0.2 font-mono text-[10px] text-gray-300"
                          >
                            {seat}
                          </span>
                        ))}
                      </div>
                      {(booking.concessionTotal ?? 0) > 0 ? (
                        <>
                          <span>•</span>
                          <span className="text-amber-200/90">
                            F&B {formatVnd(booking.concessionTotal ?? 0)}
                            {booking.concessions?.length
                              ? ` (${booking.concessions.map((c) => `${c.name}×${c.qty}`).join(", ")})`
                              : ""}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-right">
                      <span className="font-display font-semibold text-white">{formatVnd(booking.total)}</span>
                      {(booking.seatTotal ?? 0) > 0 ? (
                        <p className="text-[10px] text-muted-foreground">Ghế {formatVnd(booking.seatTotal ?? 0)}</p>
                      ) : null}
                    </div>
                    <Badge variant="outline" className={`rounded-full text-xs font-semibold ${statusColor}`}>
                      {booking.status}
                    </Badge>
                    {canCancel ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-white/10 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
                        onClick={() => void cancel(booking)}
                      >
                        Hủy
                      </Button>
                    ) : null}
                    {canRefund ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                        onClick={() => void refund(booking)}
                      >
                        Hoàn tiền
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminBookingsPage;
