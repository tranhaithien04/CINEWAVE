export const MAX_SEATS_PER_BOOKING = 8;
export const SEAT_ROWS = ["A", "B", "C", "D", "E", "F"] as const;
export const SEATS_PER_ROW = 10;

export type SeatType = "STANDARD" | "VIP" | "COUPLE";
export type OccupancyState = "AVAILABLE" | "HELD" | "SOLD" | "BLOCKED" | "MINE_HELD";

export type RoomSeatDef = {
  label: string;
  row: string;
  number: number;
  type: SeatType;
  partner: string | null;
};

export function aisleBreakAfterIndices(colCount: number) {
  const count = Math.max(colCount, 1);
  const leftBreak = Math.max(1, Math.floor(count * 0.4) - 1);
  const rightBreak = Math.max(leftBreak + 1, Math.floor(count * 0.6) - 1);
  return [leftBreak, rightBreak] as const;
}

export function seatsCrossAisle(numberA: number, numberB: number, colCount: number) {
  const lo = Math.min(numberA, numberB);
  const hi = Math.max(numberA, numberB);
  if (hi - lo !== 1) return true;
  const after = aisleBreakAfterIndices(colCount);
  return after.includes(lo - 1);
}

export function seatLabel(row: string, number: number) {
  return `${row}${number}`;
}

export function parseSeatLabel(label: string) {
  const normalized = label.trim().toUpperCase();
  const row = normalized.replace(/[0-9]/g, "");
  const number = Number(normalized.replace(/[A-Za-z]/g, ""));
  return { label: normalized, row, number };
}

export function createDefaultRoomSeats(): RoomSeatDef[] {
  return SEAT_ROWS.flatMap((row) =>
    Array.from({ length: SEATS_PER_ROW }, (_, index) => {
      const number = index + 1;
      const label = seatLabel(row, number);
      let type: SeatType = "STANDARD";
      let partner: string | null = null;
      if (row === "F") type = "VIP";
      if (row === "A" && number === 5) {
        type = "COUPLE";
        partner = "A6";
      }
      if (row === "A" && number === 6) {
        type = "COUPLE";
        partner = "A5";
      }
      return { label, row, number, type, partner };
    }),
  );
}

export function indexRoomSeats(seats: RoomSeatDef[]) {
  return new Map(seats.map((seat) => [seat.label.toUpperCase(), seat]));
}

/** Legacy fallback when no room layout is available. */
export function seatTypeFromLabel(label: string): SeatType {
  const { row, number } = parseSeatLabel(label);
  if (row === "F") return "VIP";
  if (row === "A" && (number === 5 || number === 6)) return "COUPLE";
  return "STANDARD";
}

export function seatTypeInLayout(label: string, seats: RoomSeatDef[]): SeatType {
  const hit = indexRoomSeats(seats).get(label.trim().toUpperCase());
  return hit?.type ?? seatTypeFromLabel(label);
}

export function unitSeatPrice(base: number, type: SeatType) {
  if (type === "VIP") return Math.round(base * 1.3);
  if (type === "COUPLE") return base * 2;
  return base;
}

export function computeSeatTotal(seats: string[], priceBase: number, layoutSeats?: RoomSeatDef[]) {
  const source = layoutSeats ?? createDefaultRoomSeats();
  return seats.reduce((sum, label) => sum + unitSeatPrice(priceBase, seatTypeInLayout(label, source)), 0);
}

export function couplePartnerLabel(label: string, layoutSeats?: RoomSeatDef[]) {
  const source = layoutSeats ?? createDefaultRoomSeats();
  const hit = indexRoomSeats(source).get(label.trim().toUpperCase());
  if (!hit || hit.type !== "COUPLE") return null;
  if (hit.partner) {
    const partner = indexRoomSeats(source).get(hit.partner.trim().toUpperCase());
    if (!partner || partner.type !== "COUPLE") return null;
    const colCount = Math.max(1, ...source.filter((seat) => seat.row === hit.row).map((seat) => seat.number));
    if (seatsCrossAisle(hit.number, partner.number, colCount)) return null;
    return partner.label;
  }
  const colCount = Math.max(1, ...source.filter((seat) => seat.row === hit.row).map((seat) => seat.number));
  const neighbor = source.find(
    (seat) =>
      seat.type === "COUPLE" &&
      seat.row === hit.row &&
      seat.label !== hit.label &&
      Math.abs(seat.number - hit.number) === 1 &&
      !seatsCrossAisle(hit.number, seat.number, colCount),
  );
  return neighbor?.label ?? null;
}

export function normalizeSeatLabels(seats: string[]) {
  return [...new Set(seats.map((seat) => seat.trim().toUpperCase()).filter(Boolean))];
}

export function isKnownSeatLabel(label: string, layoutSeats?: RoomSeatDef[]) {
  const source = layoutSeats ?? createDefaultRoomSeats();
  return indexRoomSeats(source).has(label.trim().toUpperCase());
}

export function assertValidSeatSelection(seats: string[], blockedSeats: string[] = [], layoutSeats?: RoomSeatDef[]) {
  const labels = normalizeSeatLabels(seats);
  const blocked = new Set(normalizeSeatLabels(blockedSeats));
  const layout = layoutSeats ?? createDefaultRoomSeats();
  if (!labels.length) {
    throw new Error("EMPTY_SEATS");
  }
  if (labels.length > MAX_SEATS_PER_BOOKING) {
    throw new Error("TOO_MANY_SEATS");
  }
  for (const label of labels) {
    if (!isKnownSeatLabel(label, layout)) throw new Error("VALIDATION_ERROR");
    if (blocked.has(label)) throw new Error("SEAT_BLOCKED");
    const partner = couplePartnerLabel(label, layout);
    if (partner && !labels.includes(partner)) throw new Error("INVALID_COUPLE_PAIR");
  }
  return labels;
}

export function buildSeatLayout(blockedSeats: string[] = [], layoutSeats?: RoomSeatDef[]) {
  const blocked = new Set(normalizeSeatLabels(blockedSeats));
  const source = layoutSeats ?? createDefaultRoomSeats();
  return source.map((seat) => ({
    id: `seat-${seat.label}`,
    label: seat.label,
    row: seat.row,
    number: seat.number,
    type: seat.type,
    partner: seat.partner,
    blocked: blocked.has(seat.label),
  }));
}

export function parseBlockedSeatsInput(value: unknown, layoutSeats?: RoomSeatDef[]): string[] {
  const raw = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
      ? value.split(/[\s,;]+/)
      : [];
  const labels = normalizeSeatLabels(raw);
  const layout = layoutSeats ?? createDefaultRoomSeats();
  for (const label of labels) {
    if (!isKnownSeatLabel(label, layout)) {
      throw new Error(`Ghế không hợp lệ: ${label}`);
    }
  }
  return labels;
}

export function normalizeRoomSeats(seats: RoomSeatDef[]): RoomSeatDef[] {
  return [...seats]
    .map((seat) => ({
      label: seat.label.toUpperCase(),
      row: seat.row.toUpperCase(),
      number: seat.number,
      type: seat.type,
      partner: seat.partner ? seat.partner.toUpperCase() : null,
    }))
    .sort((a, b) => {
      if (a.row !== b.row) return a.row.localeCompare(b.row);
      return a.number - b.number;
    });
}
