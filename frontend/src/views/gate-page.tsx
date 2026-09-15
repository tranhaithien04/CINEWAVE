"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, ShieldAlert, Ticket } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ApiError } from "@/api/client";
import { checkInTicket, inspectTicket, type PublicTicket } from "@/api/tickets";
import { AgeBadge } from "@/components/movies/age-badge";
import { EmptyState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/data/mock-catalog";
import { useAuth } from "@/hooks/use-auth";
import { useCatalog } from "@/hooks/use-catalog";
import { paths } from "@/routes/paths";
import { formatTime } from "@/utils/datetime";

export function GatePage({ code }: { code: string }) {
  const searchParams = useSearchParams();
  const sig = searchParams?.get("s") ?? searchParams?.get("sig") ?? "";
  const { user, loading: authLoading } = useAuth();
  const { getMovieBySlug, getShowtimeById } = useCatalog();
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [validForEntry, setValidForEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const canCheckIn = user?.role === "ADMIN" || user?.role === "STAFF";

  useEffect(() => {
    let cancelled = false;
    inspectTicket(code, sig)
      .then((data) => {
        if (cancelled) return;
        setTicket(data.ticket);
        setValidForEntry(data.validForEntry);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setTicket(null);
        setError(err instanceof ApiError ? err.message : "Không đọc được vé");
      });
    return () => {
      cancelled = true;
    };
  }, [code, sig]);

  async function checkIn() {
    setChecking(true);
    try {
      const data = await checkInTicket(code, sig);
      setTicket(data.ticket);
      setValidForEntry(false);
      toast.success(`Đã check-in ${data.ticket.code}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không check-in được");
    } finally {
      setChecking(false);
    }
  }

  const movie = ticket ? getMovieBySlug(ticket.movieSlug) : null;
  const showtime = ticket ? getShowtimeById(ticket.showtimeId) : null;
  const used = ticket?.status === "USED";

  return (
    <main className="mx-auto max-w-lg px-4 py-10 md:py-16">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6 text-gray-400 hover:text-white">
        <Link href={canCheckIn ? paths.staff : paths.tickets}>
          <ArrowLeft className="h-4 w-4" /> {canCheckIn ? "Soát vé" : "Vé của tôi"}
        </Link>
      </Button>

      {error ? (
        <EmptyState title="QR không hợp lệ" description={error} />
      ) : !ticket ? (
        <p className="text-sm text-muted-foreground">Đang xác thực mã vé…</p>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-400">
              <Ticket className="h-3.5 w-3.5" /> Cổng soát vé
            </p>
            <Badge
              className={
                used
                  ? "border-white/15 bg-white/10 text-gray-300"
                  : validForEntry
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    : "border-rose-500/30 bg-rose-500/15 text-rose-300"
              }
            >
              {used ? "Đã vào rạp" : validForEntry ? "Hợp lệ — chờ vào" : ticket.status}
            </Badge>
          </div>

          <div className="mb-4 flex items-center gap-2">
            {movie ? <AgeBadge rating={movie.rating} /> : null}
            <h1 className="font-display text-2xl font-black text-white">{movie?.title ?? ticket.movieSlug}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {showtime ? `${showtime.cinema} · ${showtime.room}` : ticket.showtimeId}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs">
            <div>
              <dt className="text-muted-foreground">Mã vé</dt>
              <dd className="font-mono text-sm font-bold text-cyan-300">{ticket.code}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ghế</dt>
              <dd className="font-display text-sm font-bold text-white">{ticket.seats.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tổng tiền</dt>
              <dd className="font-semibold text-emerald-400">{formatVnd(ticket.total)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Check-in</dt>
              <dd className="text-gray-200">
                {ticket.checkedInAt ? formatTime(ticket.checkedInAt) : "Chưa"}
              </dd>
            </div>
          </dl>

          {used ? (
            <p className="mt-5 flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Vé đã được sử dụng. Không check-in lần hai.
            </p>
          ) : validForEntry && canCheckIn ? (
            <Button
              size="lg"
              className="mt-5 h-12 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600"
              disabled={checking}
              onClick={() => void checkIn()}
            >
              {checking ? "Đang check-in…" : "Cho khách vào rạp"}
            </Button>
          ) : validForEntry && !authLoading && !canCheckIn ? (
            <div className="mt-5 space-y-3">
              <p className="flex items-center gap-2 text-sm text-amber-200">
                <ShieldAlert className="h-4 w-4" /> Chỉ nhân viên / admin mới check-in được.
              </p>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href={paths.loginNext(paths.gate(code, sig))}>Đăng nhập nhân viên</Link>
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}

export default GatePage;
