"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ScanLine, ShieldAlert, Ticket, Wallet, XCircle } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/api/client";
import {
  checkInTicket,
  inspectTicketAsStaff,
  payoutRefund,
  type PublicTicket,
  type TicketInspectResult,
} from "@/api/tickets";
import { AgeBadge } from "@/components/movies/age-badge";
import { EmptyState } from "@/components/shared/state-views";
import { TicketScanner } from "@/components/tickets/ticket-scanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatVnd } from "@/data/mock-catalog";
import { useAuth } from "@/hooks/use-auth";
import { useCatalog } from "@/hooks/use-catalog";
import { paths } from "@/routes/paths";

export function StaffScanPage({
  initialRefund,
  initialSig,
}: {
  initialRefund?: string;
  initialSig?: string;
}) {
  const { user, loading } = useAuth();
  const { getMovieBySlug, getShowtimeById } = useCatalog();
  const [result, setResult] = useState<TicketInspectResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [scanReset, setScanReset] = useState(0);
  const [lastSig, setLastSig] = useState<string | undefined>();

  const onScan = useCallback(async (payload: { kind?: "ticket" | "refund"; code: string; sig?: string }) => {
    setBusy(true);
    setLookupError(null);
    try {
      const data = await inspectTicketAsStaff(payload.code, payload.sig, payload.kind);
      setResult(data);
      setLastSig(payload.sig);
      if (data.verdict === "VALID") {
        toast.success(`Vé ${data.ticket.code} hợp lệ`);
      } else if (data.verdict === "REFUND_PENDING") {
        toast.message(`Phiếu hoàn tiền ${data.ticket.code}`);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      setResult(null);
      const message = err instanceof ApiError ? err.message : "Không kiểm tra được vé";
      setLookupError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!initialRefund) return;
    void onScan({ kind: "refund", code: initialRefund, sig: initialSig });
  }, [initialRefund, initialSig, onScan]);

  async function checkIn(ticket: PublicTicket) {
    setChecking(true);
    try {
      const data = await checkInTicket(ticket.code, lastSig);
      setResult({
        ticket: data.ticket,
        validForEntry: false,
        verdict: "USED",
        message: "Vé đã được sử dụng. Không cho vào lần hai.",
        signed: Boolean(lastSig),
      });
      toast.success(`Đã check-in ${data.ticket.code}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không check-in được");
    } finally {
      setChecking(false);
    }
  }

  async function payout(ticket: PublicTicket) {
    setChecking(true);
    try {
      const data = await payoutRefund(ticket.code);
      setResult({
        ticket: data.ticket,
        validForEntry: false,
        validForRefund: false,
        kind: "refund",
        verdict: "REFUNDED",
        message: "Đã hoàn tiền rồi. Không trả lần hai.",
        signed: Boolean(lastSig),
      });
      toast.success(`Đã trả ${ticket.code}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không hoàn tiền được");
    } finally {
      setChecking(false);
    }
  }

  function scanNext() {
    setResult(null);
    setLookupError(null);
    setLastSig(undefined);
    setScanReset((value) => value + 1);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-64 w-full bg-white/5" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
        <EmptyState title="Cần đăng nhập nhân viên" description="Trang soát vé dành cho role STAFF hoặc ADMIN." />
        <Button asChild className="rounded-xl">
          <Link href={paths.loginNext(paths.staff)}>Đăng nhập nhân viên</Link>
        </Button>
      </main>
    );
  }

  if (user.role !== "STAFF" && user.role !== "ADMIN") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="Không có quyền soát vé"
          description="Tài khoản khách không vào được cổng. Đăng nhập staff@cinewave.vn để quét QR."
        />
      </main>
    );
  }

  const ticket = result?.ticket ?? null;
  const movie = ticket ? getMovieBySlug(ticket.movieSlug) : null;
  const showtime = ticket ? getShowtimeById(ticket.showtimeId) : null;
  const verdict = result?.verdict;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8 md:py-12">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-400">
          <ScanLine className="h-3.5 w-3.5" /> Cổng soát vé · {user.role}
        </p>
        <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-white">Quét QR kiểm vé</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quét mã trên vé điện tử để biết vé hợp lệ, đã dùng, hay giả.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <TicketScanner onScan={(payload) => void onScan(payload)} disabled={busy} resetToken={scanReset} />
      </div>

      {lookupError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          <p className="flex items-center gap-2 font-semibold">
            <XCircle className="h-4 w-4" /> QR không hợp lệ
          </p>
          <p className="mt-1 text-xs text-rose-200/80">{lookupError}</p>
        </div>
      ) : null}

      {result && ticket ? (
        <div
          className={`rounded-3xl border p-5 ${
            verdict === "VALID"
              ? "border-emerald-500/40 bg-emerald-500/10"
              : verdict === "USED" || verdict === "REFUND_PENDING"
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-rose-500/40 bg-rose-500/10"
          }`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white">
              <Ticket className="h-3.5 w-3.5" /> {verdict === "REFUND_PENDING" || verdict === "REFUNDED" ? "Phiếu hoàn tiền" : "Kết quả soát vé"}
            </p>
            <Badge
              className={
                verdict === "VALID"
                  ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                  : verdict === "USED" || verdict === "REFUND_PENDING"
                    ? "border-amber-400/40 bg-amber-500/20 text-amber-100"
                    : "border-rose-400/40 bg-rose-500/20 text-rose-100"
              }
            >
              {verdict === "VALID"
                ? "Hợp lệ"
                : verdict === "USED"
                  ? "Đã dùng"
                  : verdict === "REFUND_PENDING"
                    ? "Chờ hoàn tiền"
                    : verdict === "REFUNDED"
                      ? "Đã hoàn"
                      : "Không hợp lệ"}
            </Badge>
          </div>

          <div className="mb-2 flex items-center gap-2">
            {movie ? <AgeBadge rating={movie.rating} /> : null}
            <h2 className="font-display text-xl font-black text-white">{movie?.title ?? ticket.movieSlug}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {showtime ? `${showtime.cinema} · ${showtime.room}` : ticket.showtimeId}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs">
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
              <dt className="text-muted-foreground">Trạng thái</dt>
              <dd className="text-gray-200">{ticket.status}</dd>
            </div>
          </dl>

          <p
            className={`mt-4 flex items-start gap-2 text-sm ${
              verdict === "VALID"
                ? "text-emerald-200"
                : verdict === "USED" || verdict === "REFUND_PENDING"
                  ? "text-amber-100"
                  : "text-rose-100"
            }`}
          >
            {verdict === "VALID" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : verdict === "REFUND_PENDING" ? (
              <Wallet className="mt-0.5 h-4 w-4 shrink-0" />
            ) : verdict === "USED" ? (
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {result.message}
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {result.validForEntry ? (
              <Button
                className="h-11 flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600"
                disabled={checking}
                onClick={() => void checkIn(ticket)}
              >
                {checking ? "Đang check-in…" : "Cho khách vào rạp"}
              </Button>
            ) : null}
            {result.validForRefund ? (
              <Button
                className="h-11 flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black"
                disabled={checking}
                onClick={() => void payout(ticket)}
              >
                <Wallet className="h-4 w-4" />
                {checking ? "Đang xác nhận…" : `Đã trả tiền mặt ${formatVnd(ticket.total)}`}
              </Button>
            ) : null}
            <Button variant="outline" className="h-11 rounded-xl" onClick={scanNext}>
              Quét vé tiếp
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default StaffScanPage;
