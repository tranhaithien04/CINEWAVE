export function hasSeatIds(seatIds: unknown): seatIds is string[] {
  return Array.isArray(seatIds) && seatIds.every((id) => typeof id === "string");
}
