"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2, Clock, Copy, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { confirmPayment, createPaymentIntent, fetchPaymentStatus, type PaymentInfo } from "@/api/payments";
import type { Booking } from "@/api/bookings";
import { fetchBooking, updateBookingConcessions } from "@/api/bookings";
import { fetchConcessions, fetchShowtime, type ConcessionItem } from "@/api/catalog";
import type { Showtime } from "@/@types/movie";
import { AgeGateDialog, needsAgeGate } from "@/components/age-gate/age-gate-dialog";
import { ConcessionPicker } from "@/components/booking/concession-picker";
import { PriceBreakdown } from "@/components/booking/price-breakdown";
import { AgeBadge } from "@/components/movies/age-badge";
import { EmptyState, ErrorState } from "@/components/shared/state-views";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatVnd, seatPrice } from "@/data/mock-catalog";
import { useAuth } from "@/hooks/use-auth";
import { useCatalog } from "@/hooks/use-catalog";
import { paths } from "@/routes/paths";
import type { Seat } from "@/@types/seat";

type PayState = "idle" | "qr" | "paid";

function seatTypeFromLabel(label: string): Seat["type"] {
  if (label.startsWith("F")) return "VIP";
  if (label === "A5" || label === "A6") return "COUPLE";
  return "STANDARD";
}

export function CheckoutPage({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showtimes, getMovieBySlug, getShowtimeById } = useCatalog();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [gateOpen, setGateOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [pay, setPay] = useState<PayState>("idle");
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [menu, setMenu] = useState<ConcessionItem[]>([]);
  const [comboQty, setComboQty] = useState<Record<string, number>>({});
  const [savingCombo, setSavingCombo] = useState(false);
  const [fetchedShow, setFetchedShow] = useState<Showtime | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  function copyText(text: string, field: string) {
    void navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function applyPaid(code: string) {
    setTicketCode(code);
    setPay("paid");
  }

  function syncExpiry(iso?: string | null) {
    if (!iso) return;
    const seconds = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
    setTimeLeft(seconds);
  }

  async function startSepayIntent() {
    setPaying(true);
    try {
      const data = await createPaymentIntent(bookingId);
      setBooking(data.booking);
      setPayment(data.payment);
      syncExpiry(data.payment.expiresAt);
      if (data.booking.status === "PAID" || data.booking.status === "USED") {
        applyPaid(data.booking.code);
        return;
      }
      setPay("qr");
      toast.message("Mã VietQR SePay đã sẵn sàng. Quét để chuyển khoản.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tạo được mã thanh toán");
    } finally {
      setPaying(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoadingBooking(false);
      return;
    }
    let cancelled = false;
    setLoadingBooking(true);
    fetchBooking(bookingId)
      .then((data) => {
        if (cancelled) return;
        setBooking(data.booking);
        setLoadError(null);
        syncExpiry(data.booking.paymentExpiresAt ?? data.booking.holdExpiresAt);
        if (data.booking.status === "PAID" || data.booking.status === "USED") {
          applyPaid(data.booking.code);
        } else if (data.booking.status === "PENDING_PAYMENT") {
          setPay("qr");
          void createPaymentIntent(bookingId)
            .then((intent) => {
              if (cancelled) return;
              setBooking(intent.booking);
              setPayment(intent.payment);
              syncExpiry(intent.payment.expiresAt);
            })
            .catch(() => {
              /* poll will fill in */
            });
        }
        const qty: Record<string, number> = {};
        for (const line of data.booking.concessions ?? []) qty[line.id] = line.qty;
        setComboQty(qty);
      })
      .catch((error) => {
        if (cancelled) return;
        setBooking(null);
        setLoadError(error instanceof Error ? error.message : "Không tải được đơn");
      })
      .finally(() => {
        if (!cancelled) setLoadingBooking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, bookingId, user]);

  useEffect(() => {
    let cancelled = false;
    void fetchConcessions()
      .then((data) => {
        if (!cancelled) setMenu(data.items);
      })
      .catch(() => {
        if (!cancelled) setMenu([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!booking?.showtimeId) return;
    if (getShowtimeById(booking.showtimeId)) return;
    let cancelled = false;
    void fetchShowtime(booking.showtimeId)
      .then((data) => {
        if (!cancelled) setFetchedShow(data.showtime);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [booking?.showtimeId, getShowtimeById]);

  async function changeCombo(id: string, next: number) {
    const qty = Math.max(0, Math.min(8, next));
    const preview = { ...comboQty, [id]: qty };
    setComboQty(preview);
    setSavingCombo(true);
    try {
      const items = Object.entries(preview)
        .filter(([, count]) => count > 0)
        .map(([itemId, count]) => ({ id: itemId, qty: count }));
      const data = await updateBookingConcessions(bookingId, items);
      setBooking(data.booking);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không cập nhật được combo");
    } finally {
      setSavingCombo(false);
    }
  }

  useEffect(() => {
    if (pay !== "qr" || !bookingId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await fetchPaymentStatus(bookingId);
        if (cancelled) return;
        setBooking(data.booking);
        if (data.payment) setPayment(data.payment);
        if (data.paid) {
          applyPaid(data.booking.code);
          toast.success("SePay đã nhận tiền. Vé đã được phát hành.");
        }
      } catch {
        /* keep polling */
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pay, bookingId]);

  const catalogShow = booking ? getShowtimeById(booking.showtimeId) : null;
  const showtime = catalogShow ?? fetchedShow ?? (showtimes.find((item) => item.id === "st-4") ?? showtimes[0]);
  const movie = showtime ? getMovieBySlug(showtime.movieSlug) : null;
  const seats = useMemo(() => {
    const labels = booking?.seats?.length ? booking.seats : ["F1", "F2"];
    return labels.map((label) => ({ label, type: seatTypeFromLabel(label) }));
  }, [booking]);
  const total = payment?.amount ?? booking?.total ?? seats.reduce((sum, seat) => sum + seatPrice(showtime?.priceBase ?? 0, seat.type), 0);
  const transferContent = payment?.content ?? booking?.paymentCode ?? booking?.code ?? bookingId;
  const isSepay = (payment?.provider ?? booking?.paymentProvider) !== "MOCK";

  useEffect(() => {
    if (!movie) return;
    setVerified(!needsAgeGate(movie.rating));
  }, [movie]);

  if (authLoading || loadingBooking) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-64 w-full bg-white/5" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <EmptyState title="Cần đăng nhập" description="Đăng nhập để giữ ghế và thanh toán." />
        <Button asChild className="rounded-xl">
          <Link href={paths.loginNext(paths.checkout(bookingId))}>Đăng nhập ngay</Link>
        </Button>
      </main>
    );
  }

  if (loadError && !booking) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState message={loadError} onRetry={() => window.location.reload()} />
      </main>
    );
  }

  if (!showtime || !movie) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState title="Không tìm thấy suất" description="Đơn này không còn suất chiếu hợp lệ." />
      </main>
    );
  }

  async function onConfirmPaid() {
    if (!showtime || !movie) return;
    setPaying(true);
    try {
      if (isSepay) {
        const data = await fetchPaymentStatus(bookingId);
        setBooking(data.booking);
        if (data.paid) {
          applyPaid(data.booking.code);
          toast.success("Thanh toán thành công! Vé đã được phát hành.");
        } else {
          toast.message("Chưa nhận được tiền từ SePay. Quét QR và chuyển đúng nội dung.");
        }
        return;
      }
      const data = await confirmPayment({
        bookingId,
        showtimeId: showtime.id,
        movieSlug: movie.slug,
        seats: seats.map((seat) => seat.label),
        total,
      });
      applyPaid(data.booking.code);
      toast.success("Thanh toán thành công! Vé đã được phát hành.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thanh toán thất bại");
    } finally {
      setPaying(false);
    }
  }

  const orderCode = booking?.code ?? bookingId;
  const showDate = new Date(showtime.startsAt);
  const seatsPath = paths.seats(showtime.id);
  const canGoBack = pay !== "paid";
  const backLabel = pay === "qr" ? "Quay lại bước trước" : "Quay lại chọn ghế";

  function goBack() {
    if (!canGoBack) return;
    if (gateOpen) {
      setGateOpen(false);
      return;
    }
    if (pay === "qr") {
      setPay("idle");
      return;
    }
    router.push(seatsPath);
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 md:py-12">
      {canGoBack ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-mb-2 w-fit px-2 text-gray-400 hover:text-white"
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      ) : null}

      <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs backdrop-blur-xl">
        <button
          type="button"
          className="flex items-center gap-2 font-medium text-cyan-400 disabled:cursor-default"
          disabled={!canGoBack}
          onClick={() => router.push(seatsPath)}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[11px] font-bold">
            ✓
          </span>
          <span className="hidden sm:inline">1. Chọn ghế</span>
          <span className="sm:hidden">Ghế</span>
        </button>
        <span className="h-px flex-1 bg-cyan-500/30" />
        <button
          type="button"
          className={`flex items-center gap-2 font-medium ${verified ? "text-cyan-400" : "text-amber-400"} disabled:cursor-default`}
          disabled={!canGoBack || pay === "idle"}
          onClick={() => {
            if (pay === "qr") setPay("idle");
          }}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold">
            {verified ? "✓" : "2"}
          </span>
          <span className="hidden sm:inline">2. Xác thực CCCD</span>
          <span className="sm:hidden">CCCD</span>
        </button>
        <span className="h-px flex-1 bg-white/10" />
        <div className={`flex items-center gap-2 font-medium ${pay !== "idle" ? "text-cyan-400" : "text-gray-400"}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold">
            3
          </span>
          <span className="hidden sm:inline">3. VietQR SePay</span>
          <span className="sm:hidden">QR</span>
        </div>
        <span className="h-px flex-1 bg-white/10" />
        <div className={`flex items-center gap-2 font-medium ${pay === "paid" ? "text-emerald-400" : "text-gray-500"}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold">
            4
          </span>
          <span className="hidden sm:inline">4. Nhận vé</span>
          <span className="sm:hidden">Vé</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400">
            MÃ ĐƠN HÀNG #{orderCode}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">Thanh toán vé xem phim</h1>
        </div>
        {pay !== "paid" && timeLeft > 0 ? (
          <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
            <Clock className="h-3.5 w-3.5 animate-spin text-amber-400" />
            <span>Ghế giữ còn: </span>
            <span className="font-mono text-sm font-bold text-white">{formatCountdown(timeLeft)}</span>
          </div>
        ) : null}
      </div>

      <Card className="overflow-hidden rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-cyan-500/5">
        <div className="relative p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{movie.title}</h2>
                  <AgeBadge rating={movie.rating} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {showtime.cinema} · <span className="text-cyan-300 font-semibold">{showtime.room}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {showDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                  {showDate.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Tổng tiền vé</span>
              <p className="font-display text-2xl font-bold text-cyan-300">{formatVnd(total)}</p>
            </div>
          </div>

          <div className="pt-4">
            <PriceBreakdown seats={seats} priceBase={showtime.priceBase} concessions={booking?.concessions ?? []} />
          </div>
        </div>
      </Card>

      {pay === "idle" && menu.length > 0 ? (
        <Card className="rounded-2xl border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
          <ConcessionPicker items={menu} qty={comboQty} disabled={savingCombo || paying} onChange={(id, next) => void changeCombo(id, next)} />
        </Card>
      ) : null}

      {needsAgeGate(movie.rating) && !verified ? (
        <Alert className="rounded-2xl border-cyan-500/30 bg-cyan-500/5 backdrop-blur-xl">
          <ShieldCheck className="h-5 w-5 text-cyan-400" />
          <AlertTitle className="text-white font-semibold">Phim nhãn {movie.rating} - Yêu cầu xác thực độ tuổi</AlertTitle>
          <AlertDescription className="text-xs text-gray-400">
            Theo quy định Điện ảnh Việt Nam, bạn cần xác minh thẻ CCCD/VNeID bằng AI Vision trước khi tạo mã QR thanh toán.
          </AlertDescription>
        </Alert>
      ) : null}

      {pay === "qr" ? (
        <Card className="rounded-2xl border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 via-white/[0.02] to-transparent p-6 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
          <CardHeader className="p-0 text-center pb-6 border-b border-white/5">
            <div className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              {isSepay ? "Cổng thanh toán SePay · VietQR 247" : "Chế độ demo · chưa cấu hình SePay"}
            </div>
            <CardTitle className="text-xl text-white">Quét mã QR để hoàn tất đặt vé</CardTitle>
            <p className="text-xs text-muted-foreground">
              {isSepay
                ? "Hệ thống tự xác nhận vé khi SePay báo đã nhận tiền."
                : "Hỗ trợ tất cả ứng dụng ngân hàng và ví điện tử tại Việt Nam"}
            </p>
          </CardHeader>

          <CardContent className="p-0 pt-6">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="relative flex h-52 w-52 items-center justify-center rounded-2xl bg-white p-3 text-zinc-950 shadow-2xl shadow-cyan-500/20">
                  {payment?.qrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={payment.qrUrl} alt="VietQR SePay" className="h-full w-full object-contain" />
                  ) : (
                    <p className="px-4 text-center text-xs text-zinc-600">
                      Chưa có STK SePay. Điền SEPAY_ACCOUNT_NUMBER trong backend/.env
                    </p>
                  )}
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-mono uppercase text-gray-400 tracking-wider">
                  QUÉT BẰNG APP NGÂN HÀNG
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Ngân hàng thụ hưởng</span>
                  <p className="font-semibold text-white mt-0.5">{payment?.bankLabel ?? "MB Bank"}</p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Số tài khoản</span>
                    <p className="font-mono text-sm font-bold text-cyan-300 mt-0.5">{payment?.accountNumber ?? "—"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{payment?.accountName}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-lg text-xs hover:bg-white/10"
                    onClick={() => copyText(payment?.accountNumber ?? "", "stk")}
                    disabled={!payment?.accountNumber}
                  >
                    {copiedField === "stk" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Số tiền thanh toán</span>
                    <p className="font-display text-sm font-bold text-white mt-0.5">{formatVnd(total)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-lg text-xs hover:bg-white/10"
                    onClick={() => copyText(String(total), "amount")}
                  >
                    {copiedField === "amount" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-cyan-300 font-semibold">Nội dung chuyển khoản (Bắt buộc)</span>
                    <p className="font-mono text-sm font-bold text-white mt-0.5">{transferContent}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-lg text-xs hover:bg-cyan-500/20"
                    onClick={() => copyText(transferContent, "msg")}
                  >
                    {copiedField === "msg" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-cyan-300" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/5 pt-6">
              <p className="text-xs text-muted-foreground">
                {isSepay
                  ? "Trang này tự kiểm tra mỗi 3 giây. Không đóng tab cho đến khi vé được kích hoạt."
                  : "Chế độ demo: bấm xác nhận để phát hành vé ngay."}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button type="button" variant="outline" size="lg" className="rounded-xl" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại bước trước
                </Button>
                <Button
                  size="lg"
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500"
                  disabled={paying}
                  onClick={() => void onConfirmPaid()}
                >
                  {paying
                    ? "Đang kiểm tra giao dịch..."
                    : isSepay
                      ? "Tôi đã chuyển khoản — kiểm tra lại"
                      : "Tôi đã chuyển khoản thành công"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {pay === "paid" ? (
        <Card className="rounded-2xl border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 to-transparent p-8 text-center backdrop-blur-xl shadow-2xl shadow-emerald-500/10">
          <CardContent className="flex flex-col items-center gap-4 p-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Thanh toán hoàn tất thành công!</h2>
              <p className="mt-1 text-sm text-gray-300">
                Vé điện tử Hologram với mã QR duy nhất đã sẵn sàng trong ví vé của bạn.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-mono text-sm text-cyan-300">
              Mã vé: {ticketCode ?? orderCode}
            </div>
            <Button
              size="lg"
              className="mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
              onClick={() => router.push(paths.ticket(ticketCode ?? orderCode))}
            >
              Xem vé Hologram QR ngay
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {pay === "idle" ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" size="lg" className="h-12 rounded-xl sm:w-auto" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Quay lại chọn ghế
          </Button>
          <Button
            size="lg"
            className="h-12 flex-1 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 font-semibold text-white shadow-xl shadow-cyan-500/20 transition-[transform,box-shadow] duration-300 hover:scale-[1.01] hover:from-cyan-400 hover:to-blue-500"
            disabled={paying}
            onClick={() => {
              if (needsAgeGate(movie.rating) && !verified) {
                setGateOpen(true);
                return;
              }
              void startSepayIntent();
            }}
          >
            {verified ? "Tạo mã VietQR SePay" : "Xác minh độ tuổi CCCD rồi thanh toán"}
          </Button>
        </div>
      ) : null}

      <AgeGateDialog
        open={gateOpen}
        rating={movie.rating}
        movieSlug={movie.slug}
        onOpenChange={setGateOpen}
        onPassed={() => {
          setVerified(true);
          setGateOpen(false);
          void startSepayIntent();
        }}
      />
    </main>
  );
}

export default CheckoutPage;
