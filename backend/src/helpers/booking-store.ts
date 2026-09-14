import { BookingModel } from "../db/models.js";
import { toPlain, toPlainList } from "../db/mongo.js";
import type { BookingRecord } from "../models/catalog.js";

const seed: BookingRecord[] = [
  {
    id: "bk-1",
    code: "CW-9F2K",
    movieSlug: "dao-hai-tac",
    showtimeId: "st-1",
    seats: ["F1", "F2"],
    status: "PAID",
    total: 312000,
    userEmail: "demo@cinewave.vn",
    createdAt: "2026-09-12T10:00:00.000Z",
  },
  {
    id: "bk-2",
    code: "CW-3L8P",
    movieSlug: "dem-ha-noi",
    showtimeId: "st-3",
    seats: ["C4"],
    status: "USED",
    total: 95000,
    userEmail: "demo@cinewave.vn",
    createdAt: "2026-09-11T08:30:00.000Z",
  },
];

export async function ensureBookingSeed() {
  const count = await BookingModel.countDocuments();
  if (count === 0) {
    await BookingModel.insertMany(seed);
  }
}

export async function listBookings() {
  const docs = await BookingModel.find().sort({ createdAt: -1 }).lean();
  return toPlainList<BookingRecord>(docs);
}

export async function getBookingById(id: string) {
  const doc = await BookingModel.findOne({ id }).lean();
  return toPlain<BookingRecord>(doc);
}

export async function getBookingByCode(code: string) {
  const doc = await BookingModel.findOne({ code }).lean();
  return toPlain<BookingRecord>(doc);
}

export async function saveBooking(booking: BookingRecord) {
  const doc = await BookingModel.findOneAndUpdate({ id: booking.id }, booking, {
    new: true,
    upsert: true,
  }).lean();
  return toPlain<BookingRecord>(doc)!;
}
