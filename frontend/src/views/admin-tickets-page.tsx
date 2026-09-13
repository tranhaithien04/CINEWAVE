"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { checkInAdminTicket, fetchAdminTickets, type AdminBooking } from "@/api/admin";
import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVnd } from "@/data/mock-catalog";
import { useCatalog } from "@/hooks/use-catalog";

export function AdminTicketsPage() {
  const { getMovieBySlug } = useCatalog();
  const [tickets, setTickets] = useState<AdminBooking[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAdminTickets();
      setTickets(data.tickets);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được vé");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function checkIn(ticket: AdminBooking) {
    try {
      await checkInAdminTicket(ticket.code);
      toast.success(`Đã check-in ${ticket.code}`);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không check-in được");
    }
  }

  const [search, setSearch] = useState("");

  const filteredTickets = tickets.filter(
    (t) =>
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.movieSlug.toLowerCase().includes(search.toLowerCase()) ||
      t.seats.some((s) => s.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">Soát vé & Check-in</h1>
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              {tickets.length} Vé
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Kiểm tra mã vé QR, quét vào phòng chiếu (một lần duy nhất).</p>
        </div>
      </div>

      <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-white">
              Danh sách vé ({filteredTickets.length})
            </CardTitle>
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Nhập mã vé (VD: CW-...) để tìm…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-white/5 pt-2">
          {error ? <p className="py-4 text-sm text-rose-300">{error}</p> : null}
          {filteredTickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Không tìm thấy vé hợp lệ.</p>
          ) : (
            filteredTickets.map((ticket) => {
              const movie = getMovieBySlug(ticket.movieSlug);
              const isPaid = ticket.status === "PAID";
              const isUsed = ticket.status === "USED";

              return (
                <div
                  key={ticket.id}
                  className="group flex flex-wrap items-center justify-between gap-4 py-3.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold tracking-wider text-cyan-300">
                        {ticket.code}
                      </span>
                      <span className="text-gray-500">·</span>
                      <p className="font-medium text-white group-hover:text-cyan-200 transition-colors truncate">
                        {movie?.title ?? ticket.movieSlug}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Ghế:</span>
                      <div className="flex gap-1">
                        {ticket.seats.map((seat) => (
                          <span
                            key={seat}
                            className="rounded bg-white/5 px-1.5 py-0.2 font-mono text-[11px] font-semibold text-cyan-300"
                          >
                            {seat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-medium text-white">{formatVnd(ticket.total)}</span>
                    <Badge
                      variant="outline"
                      className={`rounded-full text-xs font-semibold ${
                        isPaid
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          : isUsed
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 text-gray-400"
                      }`}
                    >
                      {isPaid ? "Chưa Check-in" : isUsed ? "Đã Check-in" : ticket.status}
                    </Badge>
                    {isPaid ? (
                      <Button
                        size="sm"
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-medium text-white shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500"
                        onClick={() => void checkIn(ticket)}
                      >
                        Check-in ngay
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

export default AdminTicketsPage;
