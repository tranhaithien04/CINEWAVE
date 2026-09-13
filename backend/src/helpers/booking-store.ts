import type { BookingRecord } from "../models/catalog.js";
import { readJsonFile, writeJsonFile } from "./json-store.js";

const FILE = "bookings.json";

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

async function readBookings() {
  return readJsonFile<BookingRecord[]>(FILE, seed);
}

export async function ensureBookingSeed() {
  const current = await readJsonFile<BookingRecord[] | null>(FILE, null);
  if (!current?.length) {
    await writeJsonFile(FILE, seed);
  }
}

export async function listBookings() {
  return readBookings();
}

export async function getBookingById(id: string) {
  return (await readBookings()).find((item) => item.id === id) ?? null;
}

export async function getBookingByCode(code: string) {
  return (await readBookings()).find((item) => item.code === code) ?? null;
}

export async function saveBooking(booking: BookingRecord) {
  const bookings = await readBookings();
  const index = bookings.findIndex((item) => item.id === booking.id);
  if (index === -1) bookings.push(booking);
  else bookings[index] = booking;
  await writeJsonFile(FILE, bookings);
  return booking;
}
