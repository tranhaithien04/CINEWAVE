import { appBaseUrl, sendMail } from "../helpers/mailer.js";
import { getMovieBySlug, getShowtimeById } from "../helpers/catalog-store.js";
import { ticketQrPayload } from "../helpers/ticket-qr.js";
import type { BookingRecord } from "../models/catalog.js";

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(
    value,
  );
}

export async function sendTicketPurchaseEmail(booking: BookingRecord) {
  if (!booking.userEmail) return;

  const [movie, showtime] = await Promise.all([
    getMovieBySlug(booking.movieSlug),
    getShowtimeById(booking.showtimeId),
  ]);
  const qr = ticketQrPayload(booking.code);
  const ticketUrl = `${appBaseUrl()}/tickets/${encodeURIComponent(booking.code)}`;
  const when = showtime
    ? new Date(showtime.startsAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "—";
  const cinema = showtime ? `${showtime.cinema} · ${showtime.room}` : "—";
  const seats = booking.seats.join(", ");
  const concessions =
    booking.concessions?.length
      ? booking.concessions.map((item) => `${item.name} ×${item.qty}`).join(", ")
      : "Không";

  const text = [
    `CINEWAVE — Vé điện tử ${booking.code}`,
    "",
    `Phim: ${movie?.title ?? booking.movieSlug}`,
    `Suất: ${when}`,
    `Rạp: ${cinema}`,
    `Ghế: ${seats}`,
    `F&B: ${concessions}`,
    `Tổng: ${formatMoney(booking.total)}`,
    "",
    `Xem vé / QR: ${ticketUrl}`,
    `Mã QR: ${qr.text}`,
    "",
    "Vui lòng xuất trình QR tại cổng trước giờ chiếu.",
  ].join("\n");

  await sendMail({
    to: booking.userEmail,
    subject: `[CINEWAVE] Vé ${booking.code} — ${movie?.title ?? booking.movieSlug}`,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a;max-width:560px">
        <h2 style="margin:0 0 8px">Vé điện tử CINEWAVE</h2>
        <p style="margin:0 0 16px;color:#64748b">Cảm ơn bạn đã thanh toán. Vé đã sẵn sàng.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#64748b">Mã vé</td><td style="padding:6px 0;font-weight:700">${booking.code}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Phim</td><td style="padding:6px 0">${movie?.title ?? booking.movieSlug}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Suất</td><td style="padding:6px 0">${when}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Rạp</td><td style="padding:6px 0">${cinema}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Ghế</td><td style="padding:6px 0">${seats}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">F&B</td><td style="padding:6px 0">${concessions}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Tổng tiền</td><td style="padding:6px 0;font-weight:700">${formatMoney(booking.total)}</td></tr>
        </table>
        <p style="margin:20px 0"><a href="${ticketUrl}" style="display:inline-block;padding:12px 18px;background:#0891b2;color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Mở vé & QR</a></p>
        <p style="font-size:12px;color:#64748b">Mang mã QR tới quầy/cổng soát vé. Không chia sẻ link vé công khai.</p>
      </div>
    `,
  });
}
