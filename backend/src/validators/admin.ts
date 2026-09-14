import { AGE_RATINGS } from "../models/catalog.js";
import { DomainError } from "../models/errors.js";
import { parseBlockedSeatsInput } from "../helpers/seat-pricing.js";

function text(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new DomainError("VALIDATION_ERROR", `${field} không hợp lệ`);
  }
  return value.trim();
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function num(value: unknown, field: string) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new DomainError("VALIDATION_ERROR", `${field} không hợp lệ`);
  }
  return n;
}

function parseBlockedField(value: unknown) {
  try {
    return parseBlockedSeatsInput(value);
  } catch (error) {
    throw new DomainError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Danh sách ghế khóa không hợp lệ",
    );
  }
}

export function parseMovieInput(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new DomainError("VALIDATION_ERROR", "Dữ liệu phim không hợp lệ");
  }
  const input = body as Record<string, unknown>;
  const rating = text(input.rating, "Nhãn tuổi");
  if (!AGE_RATINGS.includes(rating as (typeof AGE_RATINGS)[number])) {
    throw new DomainError("VALIDATION_ERROR", "Nhãn tuổi không hợp lệ");
  }
  const genres = Array.isArray(input.genres)
    ? input.genres.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : String(input.genres ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
  return {
    title: text(input.title, "Tên phim"),
    slug: optionalText(input.slug),
    description: text(input.description, "Mô tả"),
    durationMin: Math.round(num(input.durationMin, "Thời lượng")),
    rating: rating as (typeof AGE_RATINGS)[number],
    posterUrl: text(input.posterUrl, "Poster"),
    backdropUrl: text(input.backdropUrl, "Backdrop"),
    genres,
    nowShowing: bool(input.nowShowing, true),
    trailerUrl: optionalText(input.trailerUrl),
  };
}

export function parseShowtimeInput(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new DomainError("VALIDATION_ERROR", "Dữ liệu suất không hợp lệ");
  }
  const input = body as Record<string, unknown>;
  return {
    movieSlug: text(input.movieSlug, "Phim"),
    cinema: text(input.cinema, "Rạp"),
    room: text(input.room, "Phòng"),
    startsAt: text(input.startsAt, "Giờ chiếu"),
    priceBase: Math.round(num(input.priceBase, "Giá vé")),
    closed: bool(input.closed, false),
    blockedSeats: parseBlockedField(input.blockedSeats),
  };
}

export function parseRoomBlockedInput(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new DomainError("VALIDATION_ERROR", "Dữ liệu phòng không hợp lệ");
  }
  const input = body as Record<string, unknown>;
  return {
    cinema: text(input.cinema, "Rạp"),
    room: text(input.room, "Phòng"),
    blockedSeats: parseBlockedField(input.blockedSeats),
  };
}

export function parseUserRole(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new DomainError("VALIDATION_ERROR", "Dữ liệu user không hợp lệ");
  }
  const role = (body as { role?: string }).role;
  if (role !== "CUSTOMER" && role !== "STAFF" && role !== "ADMIN") {
    throw new DomainError("VALIDATION_ERROR", "Vai trò không hợp lệ");
  }
  return role;
}

export function parseConcessionInput(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new DomainError("VALIDATION_ERROR", "Dữ liệu combo không hợp lệ");
  }
  const input = body as Record<string, unknown>;
  const name = text(input.name, "Tên món");
  const price = Math.round(num(input.price, "Giá"));
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const active = typeof input.active === "boolean" ? input.active : true;
  const id = optionalText(input.id);
  return { id, name, description, price, active };
}

export function parseBroadcastInput(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new DomainError("VALIDATION_ERROR", "Dữ liệu thông báo không hợp lệ");
  }
  const input = body as Record<string, unknown>;
  return {
    title: text(input.title, "Tiêu đề"),
    body: text(input.body, "Nội dung"),
    href: optionalText(input.href) ?? "/notifications",
  };
}

export function slugify(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
