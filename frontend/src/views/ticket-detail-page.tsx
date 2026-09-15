"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CalendarClock, CheckCircle2, Download, Share2, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { cancelMyTicket, fetchMyTicket, type PublicTicket } from "@/api/tickets";
import { AgeBadge } from "@/components/movies/age-badge";
import { TicketQr } from "@/components/tickets/ticket-qr";
import { EmptyState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVnd, getTicketByCode } from "@/data/mock-catalog";
import { useAuth } from "@/hooks/use-auth";
import { useCatalog } from "@/hooks/use-catalog";
import { paths } from "@/routes/paths";
import { formatDateOnly } from "@/utils/datetime";

export function TicketDetailPage({ code }: { code: string }) {
  const { user, loading: authLoading } = useAuth();
  const { getMovieBySlug, getShowtimeById } = useCatalog();
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    if (!user) {
      const mock = getTicketByCode(code);
      if (!cancelled) {
        setTicket(
          mock
            ? {
                id: mock.code,
                userEmail: null,
                createdAt: new Date().toISOString(),
                checkedInAt: mock.status === "USED" ? new Date().toISOString() : null,
                ...mock,
              }
            : null,
        );
        setLoaded(true);
      }
      return;
    }
    fetchMyTicket(code)
      .then((data) => {
        if (!cancelled) setTicket(data.ticket);
      })
      .catch(() => {
        if (!cancelled) setTicket(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, code, user]);

  const movie = ticket ? getMovieBySlug(ticket.movieSlug) : null;
  const showtime = ticket ? getShowtimeById(ticket.showtimeId) : null;

  if (authLoading || !loaded) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải vé điện tử...</p>
      </main>
    );
  }

  if (!ticket || !movie) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <EmptyState title="Không tìm thấy vé" description="Mã vé không tồn tại hoặc đã bị thu hồi." />
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link href={paths.tickets}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại vé của tôi
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10 md:py-16">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-white">
          <Link href={paths.tickets}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Vé của tôi
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl border-white/10"
            onClick={() => {
              void navigator.clipboard.writeText(window.location.href);
              toast.success("Đã sao chép liên kết vé!");
            }}
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Chia sẻ
          </Button>
          <Button
            size="sm"
            className="rounded-xl bg-cyan-500 font-semibold text-black hover:bg-cyan-400 shadow-md shadow-cyan-500/20"
            onClick={() => {
              window.print();
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> In vé
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NOTCHED BOARDING PASS TICKET CONTAINER                                    */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-cinema-900/90 via-cinema-950/95 to-[#0e1322] shadow-2xl backdrop-blur-xl">
        {/* Holographic Sheen Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-purple-500/5 to-transparent opacity-60" />

        <div className="relative z-10 flex flex-col md:flex-row">
          {/* Main Info Section (Left) */}
          <div className="flex-1 space-y-4 p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-display text-xs font-bold tracking-widest text-cyan-400">
                <Sparkles className="h-3.5 w-3.5" />
                CINEWAVE IMAX PASS
              </div>
              <Badge
                className={
                  ticket.status === "USED"
                    ? "border-white/20 bg-white/10 text-gray-300"
                    : ticket.status === "CANCELLED"
                      ? "border-amber-500/30 bg-amber-500/15 text-amber-200"
                      : ticket.status === "REFUNDED"
                        ? "border-white/20 bg-white/10 text-gray-300"
                        : "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                }
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {ticket.status === "USED"
                  ? "Đã vào rạp"
                  : ticket.status === "CANCELLED"
                    ? "Chờ hoàn tiền"
                    : ticket.status === "REFUNDED"
                      ? "Đã hoàn tiền"
                      : "Đã xác nhận"}
              </Badge>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2">
                <AgeBadge rating={movie.rating} />
                <span className="font-mono text-xs text-cyan-300">Phòng {showtime?.room || "IMAX Laser 01"}</span>
              </div>
              <h1 className="font-display text-2xl font-black text-white sm:text-3xl">{movie.title}</h1>
              <p className="mt-1 text-sm text-gray-400">
                {showtime ? showtime.cinema : "CineWave Landmark Cyber Cinema"}
              </p>
            </div>

            {/* Ticket Specs Grid */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs font-mono">
              <div>
                <span className="text-gray-400">GHẾ NGỒI:</span>
                <p className="font-display text-base font-black text-cyan-300">{ticket.seats.join(", ")}</p>
              </div>
              <div>
                <span className="text-gray-400">MÃ VÉ:</span>
                <p className="font-display text-base font-black text-white">{ticket.code}</p>
              </div>
              <div>
                <span className="text-gray-400">THỜI LƯỢNG:</span>
                <p className="font-semibold text-gray-200">{movie.durationMin} phút</p>
              </div>
              <div>
                <span className="text-gray-400">TỔNG TIỀN:</span>
                <p className="font-display font-black text-emerald-400">{formatVnd(ticket.total)}</p>
              </div>
            </div>
            {(ticket.concessions ?? []).length ? (
              <p className="text-xs text-amber-200/80">
                Combo: {ticket.concessions!.map((line) => `${line.name} × ${line.qty}`).join(", ")}
              </p>
            ) : null}
          </div>

          {/* Perforated Divider with Circular Tear Notches */}
          <div className="relative flex items-center justify-center">
            <div className="hidden h-full border-r border-dashed border-white/20 md:block" />
            <div className="w-full border-b border-dashed border-white/20 md:hidden" />

            {/* Desktop Top Notch */}
            <div className="absolute -top-3.5 hidden h-7 w-7 rounded-full border border-white/15 bg-[#0a0c16] md:block" />
            {/* Desktop Bottom Notch */}
            <div className="absolute -bottom-3.5 hidden h-7 w-7 rounded-full border border-white/15 bg-[#0a0c16] md:block" />

            {/* Mobile Left Notch */}
            <div className="absolute -left-3.5 h-7 w-7 rounded-full border border-white/15 bg-[#0a0c16] md:hidden" />
            {/* Mobile Right Notch */}
            <div className="absolute -right-3.5 h-7 w-7 rounded-full border border-white/15 bg-[#0a0c16] md:hidden" />
          </div>

          {/* QR Check-in Section (Right) */}
          <div className="flex flex-col items-center justify-center p-6 md:p-8 md:min-w-[190px]">
            {ticket.status === "CANCELLED" && ticket.refundQr ? (
              <>
                <TicketQr code={ticket.code} sig={ticket.refundQr.sig} size={148} mode="refund" />
                <span className="mt-3 font-mono text-xs font-bold tracking-wider text-amber-300">
                  QR HOÀN TIỀN
                </span>
                <span className="text-center text-[10px] text-gray-400">
                  Mang ra quầy soát vé để nhận {formatVnd(ticket.total)}
                  {ticket.refundExpiresAt
                    ? ` · Hạn ${formatDateOnly(ticket.refundExpiresAt)}`
                    : ""}
                </span>
              </>
            ) : (
              <>
                <TicketQr
                  code={ticket.code}
                  sig={ticket.qr?.sig}
                  size={148}
                  used={ticket.status === "USED"}
                  stamp={ticket.status === "REFUNDED" ? "Đã hoàn" : undefined}
                />
                <span className="mt-3 font-mono text-xs font-bold tracking-wider text-cyan-400">
                  SCAN TẠI CỔNG
                </span>
                <span className="text-[10px] text-gray-400">
                  {ticket.status === "USED"
                    ? "Vé đã được sử dụng"
                    : ticket.status === "REFUNDED"
                      ? "Đã nhận tiền mặt tại quầy"
                      : `Mã QR hợp lệ cho ${ticket.seats.length} khán giả`}
                </span>
                {ticket.qr?.sig && ticket.status === "PAID" ? (
                  <Button asChild variant="ghost" size="sm" className="mt-2 text-xs text-cyan-300">
                    <Link href={paths.gate(ticket.code, ticket.qr.sig)}>Mở trang soát vé</Link>
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {user && ticket.status === "PAID" && (ticket.canCancel || ticket.canReschedule) ? (
        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-muted-foreground">
            Hủy hoặc đổi suất trước giờ chiếu ít nhất 60 phút. Hủy vé sẽ nhả ghế ngay và cấp QR hoàn tiền mặt tại quầy.
          </p>
          {confirmCancel ? (
            <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
              <p>Hủy vé {ticket.code}? QR vào rạp sẽ hết hiệu lực. Mang QR hoàn tiền ra quầy trong 7 ngày.</p>
              <div className="flex gap-2">
                <Button
                  className="rounded-xl bg-amber-500 text-black hover:bg-amber-400"
                  disabled={cancelling}
                  onClick={() => {
                    setCancelling(true);
                    void cancelMyTicket(ticket.code)
                      .then((data) => {
                        setTicket(data.ticket);
                        setConfirmCancel(false);
                        toast.success("Đã hủy vé. Dùng QR hoàn tiền tại quầy.");
                      })
                      .catch((error) => {
                        toast.error(error instanceof Error ? error.message : "Không hủy được vé");
                      })
                      .finally(() => setCancelling(false));
                  }}
                >
                  <Wallet className="mr-1.5 h-4 w-4" />
                  {cancelling ? "Đang hủy…" : "Xác nhận hủy"}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setConfirmCancel(false)}>
                  Giữ vé
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              {ticket.canReschedule ? (
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href={paths.changeShowtime(ticket.code)}>
                    <CalendarClock className="mr-1.5 h-4 w-4" />
                    Đổi suất cùng giá
                  </Link>
                </Button>
              ) : null}
              {ticket.canCancel ? (
                <Button
                  variant="outline"
                  className="rounded-xl border-amber-500/40 text-amber-200"
                  onClick={() => setConfirmCancel(true)}
                >
                  <Wallet className="mr-1.5 h-4 w-4" />
                  Hủy vé, nhận QR hoàn tiền
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}

export default TicketDetailPage;
