export const MAX_SEATS_PER_BOOKING = 8;
export const SEAT_ROWS = ["A", "B", "C", "D", "E", "F"] as const;
export const SEATS_PER_ROW = 10;

export type SeatType = "STANDARD" | "VIP" | "COUPLE";
export type OccupancyState = "AVAILABLE" | "HELD" | "SOLD" | "BLOCKED" | "MINE_HELD";

export function seatLabel(row: string, number: number) {
  return `${row}${number}`;
}

export function seatTypeFromLabel(label: string): SeatType {
  const row = label.replace(/[0-9]/g, "").toUpperCase();
  const number = Number(label.replace(/[A-Za-z]/g, ""));
  if (row === "F") return "VIP";
  if (row === "A" && (number === 5 || number === 6)) return "COUPLE";
  return "STANDARD";
}

export function unitSeatPrice(base: number, type: SeatType) {
  if (type === "VIP") return Math.round(base * 1.3);
  if (type === "COUPLE") return base * 2;
  return base;
}

export function computeSeatTotal(seats: string[], priceBase: number) {
  return seats.reduce((sum, label) => sum + unitSeatPrice(priceBase, seatTypeFromLabel(label)), 0);
}

export function couplePartnerLabel(label: string) {
  if (seatTypeFromLabel(label) !== "COUPLE") return null;
  const row = label.replace(/[0-9]/g, "");
  const number = Number(label.replace(/[A-Za-z]/g, ""));
  const partner = number === 5 ? 6 : number === 6 ? 5 : null;
  return partner ? `${row}${partner}` : null;
}

export function normalizeSeatLabels(seats: string[]) {
  return [...new Set(seats.map((seat) => seat.trim().toUpperCase()).filter(Boolean))];
}

export function isKnownSeatLabel(label: string) {
  const row = label.replace(/[0-9]/g, "").toUpperCase();
  const number = Number(label.replace(/[A-Za-z]/g, ""));
  return (SEAT_ROWS as readonly string[]).includes(row) && Number.isInteger(number) && number >= 1 && number <= SEATS_PER_ROW;
}

export function assertValidSeatSelection(seats: string[], blockedSeats: string[] = []) {
  const labels = normalizeSeatLabels(seats);
  const blocked = new Set(normalizeSeatLabels(blockedSeats));
  if (!labels.length) {
    throw new Error("EMPTY_SEATS");
  }
  if (labels.length > MAX_SEATS_PER_BOOKING) {
    throw new Error("TOO_MANY_SEATS");
  }
  for (const label of labels) {
    if (!isKnownSeatLabel(label)) throw new Error("VALIDATION_ERROR");
    if (blocked.has(label)) throw new Error("SEAT_BLOCKED");
    const partner = couplePartnerLabel(label);
    if (partner && !labels.includes(partner)) throw new Error("INVALID_COUPLE_PAIR");
  }
  return labels;
}

export function buildSeatLayout(blockedSeats: string[] = []) {
  const blocked = new Set(normalizeSeatLabels(blockedSeats));
  return SEAT_ROWS.flatMap((row) =>
    Array.from({ length: SEATS_PER_ROW }, (_, index) => {
      const number = index + 1;
      const label = seatLabel(row, number);
      return {
        id: `seat-${label}`,
        label,
        row,
        number,
        type: seatTypeFromLabel(label),
        blocked: blocked.has(label),
      };
    }),
  );
}

export function parseBlockedSeatsInput(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
      ? value.split(/[\s,;]+/)
      : [];
  const labels = normalizeSeatLabels(raw);
  for (const label of labels) {
    if (!isKnownSeatLabel(label)) {
      throw new Error(`Ghế không hợp lệ: ${label}`);
    }
  }
  return labels;
}
