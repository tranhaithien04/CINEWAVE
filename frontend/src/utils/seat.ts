import type { Seat } from "@/@types/seat";

export const MAX_SEATS_PER_BOOKING = 8;

export function isSeatTaken(seat: Seat) {
  return seat.state === "SOLD" || seat.state === "BLOCKED" || seat.state === "HELD" || seat.state === "MINE_HELD";
}

export function couplePartner(seats: Seat[], seat: Seat) {
  if (seat.type !== "COUPLE") return null;
  return (
    seats.find(
      (item) =>
        item.type === "COUPLE" &&
        item.row === seat.row &&
        item.id !== seat.id &&
        Math.abs(item.number - seat.number) === 1,
    ) ?? null
  );
}
