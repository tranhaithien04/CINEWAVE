import { AGE_RATINGS } from "../models/catalog.js";
import { DomainError } from "../models/errors.js";
import { parseBlockedSeatsInput, seatsCrossAisle } from "../helpers/seat-pricing.js";

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
  const rawBlocked = Array.isArray(input.blockedSeats)
    ? input.blockedSeats.filter((item): item is string => typeof item === "string")
    : typeof input.blockedSeats === "string"
      ? input.blockedSeats.split(/[\s,;]+/)
      : [];
  return {
    movieSlug: text(input.movieSlug, "Phim"),
    cinema: text(input.cinema, "Rạp"),
    room: text(input.room, "Phòng"),
    startsAt: text(input.startsAt, "Giờ chiếu"),
    priceBase: Math.round(num(input.priceBase, "Giá vé")),
    closed: bool(input.closed, false),
    blockedSeats: [...new Set(rawBlocked.map((seat) => seat.trim().toUpperCase()).filter(Boolean))],
  };
}

export function parseRoomBlockedInput(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new DomainError("VALIDATION_ERROR", "Dữ liệu phòng không hợp lệ");
  }
  const input = body as Record<string, unknown>;
  const raw = Array.isArray(input.blockedSeats)
    ? input.blockedSeats.filter((item): item is string => typeof item === "string")
    : typeof input.blockedSeats === "string"
      ? input.blockedSeats.split(/[\s,;]+/)
      : [];
  return {
    cinema: text(input.cinema, "Rạp"),
    room: text(input.room, "Phòng"),
    blockedSeats: [...new Set(raw.map((seat) => seat.trim().toUpperCase()).filter(Boolean))],
  };
}

const SEAT_TYPES = new Set(["STANDARD", "VIP", "COUPLE"]);

export function parseRoomLayoutInput(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new DomainError("VALIDATION_ERROR", "Dữ liệu phòng không hợp lệ");
  }
  const input = body as Record<string, unknown>;
  const cinema = text(input.cinema, "Rạp");
  const room = text(input.room, "Phòng");
  if (!Array.isArray(input.seats) || input.seats.length === 0) {
    throw new DomainError("VALIDATION_ERROR", "Sơ đồ ghế không được rỗng");
  }
  if (input.seats.length > 400) {
    throw new DomainError("VALIDATION_ERROR", "Sơ đồ ghế quá lớn");
  }

  const seats = input.seats.map((raw, index) => {
    if (!raw || typeof raw !== "object") {
      throw new DomainError("VALIDATION_ERROR", `Ghế #${index + 1} không hợp lệ`);
    }
    const seat = raw as Record<string, unknown>;
    const label = text(seat.label, `Ghế #${index + 1}`);
    const row = text(seat.row, `Hàng ghế #${index + 1}`).toUpperCase();
    const number = Math.round(num(seat.number, `Số ghế #${index + 1}`));
    const type = text(seat.type, `Loại ghế #${index + 1}`).toUpperCase();
    if (!SEAT_TYPES.has(type)) {
      throw new DomainError("VALIDATION_ERROR", `Loại ghế không hợp lệ: ${type}`);
    }
    if (!/^[A-Z]$/.test(row) || number < 1 || number > 30) {
      throw new DomainError("VALIDATION_ERROR", `Vị trí ghế không hợp lệ: ${label}`);
    }
    const expected = `${row}${number}`;
    if (label.toUpperCase() !== expected) {
      throw new DomainError("VALIDATION_ERROR", `Nhãn ghế phải là ${expected}`);
    }
    const partner =
      typeof seat.partner === "string" && seat.partner.trim()
        ? seat.partner.trim().toUpperCase()
        : null;
    return {
      label: expected,
      row,
      number,
      type: type as "STANDARD" | "VIP" | "COUPLE",
      partner,
    };
  });

  const labels = new Set(seats.map((seat) => seat.label));
  if (labels.size !== seats.length) {
    throw new DomainError("VALIDATION_ERROR", "Trùng nhãn ghế trong sơ đồ");
  }

  for (const seat of seats) {
    if (seat.type === "COUPLE") {
      if (!seat.partner || !labels.has(seat.partner)) {
        throw new DomainError("VALIDATION_ERROR", `Ghế đôi ${seat.label} thiếu cặp hợp lệ`);
      }
      const partner = seats.find((item) => item.label === seat.partner);
      if (!partner || partner.type !== "COUPLE" || partner.partner !== seat.label) {
        throw new DomainError("VALIDATION_ERROR", `Ghế đôi ${seat.label} chưa liên kết 2 chiều`);
      }
      if (partner.row !== seat.row || Math.abs(partner.number - seat.number) !== 1) {
        throw new DomainError("VALIDATION_ERROR", `Ghế đôi phải liền kề cùng hàng (${seat.label})`);
      }
      const colCount = Math.max(1, ...seats.filter((item) => item.row === seat.row).map((item) => item.number));
      if (seatsCrossAisle(seat.number, partner.number, colCount)) {
        throw new DomainError("VALIDATION_ERROR", `Ghế đôi không được bắt cặp qua lối đi (${seat.label})`);
      }
    } else if (seat.partner) {
      throw new DomainError("VALIDATION_ERROR", `Ghế ${seat.label} không phải đôi nhưng có partner`);
    }
  }

  let blockedSeats: string[] = [];
  try {
    blockedSeats = parseBlockedSeatsInput(input.blockedSeats ?? [], seats);
  } catch (error) {
    throw new DomainError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Danh sách ghế khóa không hợp lệ",
    );
  }

  return { cinema, room, seats, blockedSeats };
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
