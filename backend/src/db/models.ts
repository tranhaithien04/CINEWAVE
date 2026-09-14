import { Schema, model } from "mongoose";

import type { BookingRecord, MovieRecord, ShowtimeRecord } from "../models/catalog.js";
import type { NotificationRecord } from "../models/notification.js";
import type { UserRecord } from "../models/user.js";

const userSchema = new Schema<UserRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, default: null },
    fullName: { type: String, default: null },
    role: { type: String, required: true, enum: ["CUSTOMER", "STAFF", "ADMIN"] },
    createdAt: { type: String, required: true },
    refreshTokenHash: { type: String, default: null },
    googleId: { type: String, default: null, index: true, sparse: true },
    avatarUrl: { type: String, default: null },
    emailVerifiedAt: { type: String, default: null },
    emailVerifyTokenHash: { type: String, default: null },
    emailVerifyExpiresAt: { type: String, default: null },
  },
  { versionKey: false },
);

const movieSchema = new Schema<MovieRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    durationMin: { type: Number, required: true },
    rating: { type: String, required: true },
    posterUrl: { type: String, required: true },
    backdropUrl: { type: String, required: true },
    genres: { type: [String], default: [] },
    nowShowing: { type: Boolean, default: true },
    trailerUrl: { type: String },
    imdbId: { type: String, unique: true, sparse: true, index: true },
    tmdbId: { type: Number, unique: true, sparse: true, index: true },
    imdbRating: { type: Number },
    imdbVotes: { type: Number },
    year: { type: String },
    director: { type: String },
    actors: { type: String },
  },
  { versionKey: false },
);

const showtimeSchema = new Schema<ShowtimeRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    movieSlug: { type: String, required: true, index: true },
    cinema: { type: String, required: true },
    room: { type: String, required: true },
    startsAt: { type: String, required: true },
    priceBase: { type: Number, required: true },
    closed: { type: Boolean, default: false },
    blockedSeats: { type: [String], default: [] },
  },
  { versionKey: false },
);

const bookingSchema = new Schema<BookingRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    movieSlug: { type: String, required: true },
    showtimeId: { type: String, required: true, index: true },
    seats: { type: [String], default: [] },
    status: { type: String, required: true },
    total: { type: Number, required: true },
    seatTotal: { type: Number, default: 0 },
    concessionTotal: { type: Number, default: 0 },
    concessions: {
      type: [
        {
          _id: false,
          id: { type: String, required: true },
          qty: { type: Number, required: true },
          name: { type: String, required: true },
          unitPrice: { type: Number, required: true },
        },
      ],
      default: [],
    },
    userEmail: { type: String, default: null, index: true },
    createdAt: { type: String, required: true },
    holdExpiresAt: { type: String, default: null },
    paymentProvider: { type: String, default: null },
    paymentCode: { type: String, default: null, index: true, sparse: true },
    paymentExpiresAt: { type: String, default: null },
    sepayTransactionId: { type: String, default: null, index: true, sparse: true },
    paidAt: { type: String, default: null },
    checkedInAt: { type: String, default: null },
    cancelledAt: { type: String, default: null },
    refundExpiresAt: { type: String, default: null },
    refundedAt: { type: String, default: null },
  },
  { versionKey: false },
);

const notificationSchema = new Schema<NotificationRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    href: { type: String, default: null },
    bookingId: { type: String, default: null },
    movieSlug: { type: String, default: null },
    readAt: { type: String, default: null },
    emailSentAt: { type: String, default: null },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, bookingId: 1 });

export const UserModel = model("User", userSchema);
export const MovieModel = model("Movie", movieSchema);
export const ShowtimeModel = model("Showtime", showtimeSchema);
export const BookingModel = model("Booking", bookingSchema);
export const NotificationModel = model("Notification", notificationSchema);
