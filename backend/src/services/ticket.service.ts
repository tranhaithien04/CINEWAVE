import { listBookings, getBookingByCode, saveBooking } from "../helpers/booking-store.js";
import { getShowtimeById } from "../helpers/catalog-store.js";
import {
  detectQrKind,
  refundQrPayload,
  ticketQrPayload,
  verifyRefundQrSig,
  verifyTicketQrSig,
} from "../helpers/ticket-qr.js";
import { findUserById } from "../helpers/user-store.js";
import type { BookingRecord, ConcessionLine } from "../models/catalog.js";
import { DomainError } from "../models/errors.js";
import { notifyUser } from "./notification.service.js";
import { canModifyPaidTicket, payoutRefund } from "./booking.service.js";

const WALLET_STATUSES = new Set(["PAID", "USED", "CANCELLED", "REFUNDED"]);

export type PublicTicket = {
  id: string;
  code: string;
  movieSlug: string;
  showtimeId: string;
  seats: string[];
  status: BookingRecord["status"];
  total: number;
  seatTotal?: number;
  concessionTotal?: number;
  concessions?: ConcessionLine[];
  userEmail: string | null;
  createdAt: string;
  checkedInAt?: string | null;
  cancelledAt?: string | null;
  refundExpiresAt?: string | null;
  refundedAt?: string | null;
  canCancel?: boolean;
  canReschedule?: boolean;
  qr?: { code: string; sig: string; text: string } | null;
  refundQr?: { code: string; sig: string; text: string } | null;
};

export type TicketVerdict = "VALID" | "USED" | "UNPAID" | "CANCELLED" | "REFUND_PENDING" | "REFUNDED";

function toPublicTicket(booking: BookingRecord, withQr = false, startsAt?: string): PublicTicket {
  const canModify = booking.status === "PAID" && (!startsAt || canModifyPaidTicket(startsAt));
  return {
    id: booking.id,
    code: booking.code,
    movieSlug: booking.movieSlug,
    showtimeId: booking.showtimeId,
    seats: booking.seats,
    status: booking.status,
    total: booking.total,
    seatTotal: booking.seatTotal,
    concessionTotal: booking.concessionTotal,
    concessions: booking.concessions ?? [],
    userEmail: booking.userEmail,
    createdAt: booking.createdAt,
    checkedInAt: booking.checkedInAt ?? null,
    cancelledAt: booking.cancelledAt ?? null,
    refundExpiresAt: booking.refundExpiresAt ?? null,
    refundedAt: booking.refundedAt ?? null,
    canCancel: canModify,
    canReschedule: canModify,
    qr: withQr && booking.status === "PAID" ? ticketQrPayload(booking.code) : null,
    refundQr: withQr && booking.status === "CANCELLED" ? refundQrPayload(booking.code) : null,
  };
}

async function withShowtimeFlags(booking: BookingRecord, withQr = false) {
  const showtime = await getShowtimeById(booking.showtimeId);
  return toPublicTicket(booking, withQr, showtime?.startsAt);
}

export async function listMyTickets(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  }
  const bookings = await listBookings();
  const mine = bookings.filter((item) => item.userEmail === user.email && WALLET_STATUSES.has(item.status));
  return Promise.all(mine.map((item) => withShowtimeFlags(item, true)));
}

export async function getMyTicket(userId: string, code: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  }
  const booking = await getBookingByCode(code);
  if (!booking || booking.userEmail !== user.email || !WALLET_STATUSES.has(booking.status)) {
    throw new DomainError("NOT_FOUND", "Không tìm thấy vé", 404);
  }
  return withShowtimeFlags(booking, true);
}

export async function inspectTicket(
  code: string,
  sig: string,
  opts?: { allowUnsigned?: boolean; kind?: "ticket" | "refund" },
) {
  const normalized = String(code ?? "").trim();
  if (!normalized) {
    throw new DomainError("VALIDATION_ERROR", "Thiếu mã vé", 400);
  }
  const kind = opts?.kind === "refund" || detectQrKind(normalized, sig) === "refund" ? "refund" : "ticket";
  const hasSig = Boolean(sig);

  if (kind === "refund") {
    if (hasSig && !verifyRefundQrSig(normalized, sig)) {
      throw new DomainError("INVALID_TICKET_QR", "QR hoàn tiền không hợp lệ hoặc đã bị sửa", 400);
    }
    if (!hasSig && !opts?.allowUnsigned) {
      throw new DomainError("INVALID_TICKET_QR", "Thiếu chữ ký QR hoàn tiền", 400);
    }
  } else {
    if (hasSig && !verifyTicketQrSig(normalized, sig) && !verifyRefundQrSig(normalized, sig)) {
      throw new DomainError("INVALID_TICKET_QR", "Mã QR không hợp lệ hoặc đã bị sửa", 400);
    }
    if (hasSig && verifyRefundQrSig(normalized, sig)) {
      return inspectTicket(normalized, sig, { ...opts, kind: "refund" });
    }
    if (!hasSig && !opts?.allowUnsigned) {
      throw new DomainError("INVALID_TICKET_QR", "Thiếu chữ ký QR. Hãy quét mã trên vé.", 400);
    }
  }

  const booking = await getBookingByCode(normalized);
  if (!booking) throw new DomainError("NOT_FOUND", "Không tìm thấy vé", 404);
  const ticket = await withShowtimeFlags(booking, false);

  if (kind === "refund") {
    let verdict: TicketVerdict;
    let message: string;
    if (booking.status === "CANCELLED") {
      const expired = booking.refundExpiresAt && new Date(booking.refundExpiresAt).getTime() < Date.now();
      verdict = expired ? "CANCELLED" : "REFUND_PENDING";
      message = expired
        ? "QR hoàn tiền đã hết hạn 7 ngày. Không trả tiền mặt."
        : `Hoàn ${booking.total.toLocaleString("vi-VN")}₫ tại quầy. Không cho vào rạp.`;
    } else if (booking.status === "REFUNDED") {
      verdict = "REFUNDED";
      message = "Đã hoàn tiền rồi. Không trả lần hai.";
    } else {
      verdict = "CANCELLED";
      message = "Đây không phải phiếu hoàn tiền còn hiệu lực.";
    }
    return {
      ticket,
      validForEntry: false,
      validForRefund: verdict === "REFUND_PENDING",
      kind: "refund" as const,
      verdict,
      message,
      signed: hasSig,
    };
  }

  let verdict: TicketVerdict;
  let message: string;
  if (booking.status === "PAID") {
    verdict = "VALID";
    message = "Vé hợp lệ, chưa vào rạp.";
  } else if (booking.status === "USED") {
    verdict = "USED";
    message = "Vé đã được sử dụng. Không cho vào lần hai.";
  } else if (booking.status === "CANCELLED") {
    verdict = "CANCELLED";
    message = "Vé đã hủy. Không cho vào rạp. Khách cần QR hoàn tiền (màu khác) để nhận tiền mặt.";
  } else if (booking.status === "REFUNDED" || booking.status === "VOIDED") {
    verdict = "REFUNDED";
    message = "Vé đã hủy hoặc hoàn tiền. Không cho vào rạp.";
  } else {
    verdict = "UNPAID";
    message = "Vé chưa thanh toán hoặc hết hạn giữ chỗ.";
  }

  return {
    ticket,
    validForEntry: verdict === "VALID",
    validForRefund: booking.status === "CANCELLED",
    kind: "ticket" as const,
    verdict,
    message,
    signed: hasSig,
  };
}

export async function checkInTicket(code: string, opts?: { sig?: string; requireSig?: boolean }) {
  if (opts?.sig) {
    if (verifyRefundQrSig(code, opts.sig)) {
      throw new DomainError("INVALID_TICKET_QR", "Đây là QR hoàn tiền, không phải vé vào rạp", 400);
    }
    if (!verifyTicketQrSig(code, opts.sig)) {
      throw new DomainError("INVALID_TICKET_QR", "Mã QR không hợp lệ hoặc đã bị sửa", 400);
    }
  } else if (opts?.requireSig) {
    throw new DomainError("INVALID_TICKET_QR", "Thiếu chữ ký QR. Hãy quét mã trên vé.", 400);
  }

  const booking = await getBookingByCode(code);
  if (!booking) throw new DomainError("NOT_FOUND", "Không tìm thấy vé", 404);
  if (booking.status === "USED") {
    throw new DomainError("ALREADY_CHECKED_IN", "Vé đã check-in", 409);
  }
  if (booking.status !== "PAID") {
    throw new DomainError("FORBIDDEN_BOOKING", "Vé chưa thanh toán hoặc đã hủy", 403);
  }

  const next = await saveBooking({
    ...booking,
    status: "USED",
    checkedInAt: new Date().toISOString(),
  });

  // Gate must respond immediately — notification/email run in the background.
  void notifyUser({
    userEmail: next.userEmail,
    type: "TICKET_CHECKED_IN",
    title: "Đã vào rạp",
    body: `Vé ${next.code} đã được check-in tại cổng. Chúc bạn xem phim vui vẻ.`,
    href: `/tickets/${next.code}`,
    bookingId: next.id,
    movieSlug: next.movieSlug,
    dedupe: false,
  }).catch((error) => {
    console.error("Không gửi được thông báo check-in", error);
  });

  return withShowtimeFlags(next, false);
}

export async function confirmRefundPayout(code: string) {
  const booking = await payoutRefund(code);
  return withShowtimeFlags(booking, false);
}
