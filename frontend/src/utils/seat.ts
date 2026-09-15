import type { Seat } from "@/@types/seat";

export const MAX_SEATS_PER_BOOKING = 8;

export function isSeatTaken(seat: Seat) {
  return seat.state === "SOLD" || seat.state === "BLOCKED" || seat.state === "HELD" || seat.state === "MINE_HELD";
}

/** 0-based column indices after which an aisle gap appears (matches 3D hall layout). */
export function aisleBreakAfterIndices(colCount: number) {
  const count = Math.max(colCount, 1);
  const leftBreak = Math.max(1, Math.floor(count * 0.4) - 1);
  const rightBreak = Math.max(leftBreak + 1, Math.floor(count * 0.6) - 1);
  return [leftBreak, rightBreak] as const;
}

/** True when seat numbers (1-based) sit on opposite sides of an aisle. */
export function seatsCrossAisle(numberA: number, numberB: number, colCount: number) {
  const lo = Math.min(numberA, numberB);
  const hi = Math.max(numberA, numberB);
  if (hi - lo !== 1) return true;
  const after = aisleBreakAfterIndices(colCount);
  return after.includes(lo - 1);
}

function seatLabelOf(seat: Seat) {
  return seat.label ?? `${seat.row}${seat.number}`;
}

export function couplePartner(seats: Seat[], seat: Seat) {
  if (seat.type !== "COUPLE") return null;
  const colCount = Math.max(1, ...seats.filter((item) => item.row === seat.row).map((item) => item.number));

  if (seat.partner) {
    const want = seat.partner.trim().toUpperCase();
    const byPartner =
      seats.find((item) => seatLabelOf(item).toUpperCase() === want) ??
      seats.find((item) => item.id === `seat-${want}` || item.id === want);
    if (byPartner && byPartner.id !== seat.id && !seatsCrossAisle(seat.number, byPartner.number, colCount)) {
      return byPartner;
    }
    return null;
  }

  return (
    seats.find(
      (item) =>
        item.type === "COUPLE" &&
        item.row === seat.row &&
        item.id !== seat.id &&
        Math.abs(item.number - seat.number) === 1 &&
        !seatsCrossAisle(seat.number, item.number, colCount),
    ) ?? null
  );
}
