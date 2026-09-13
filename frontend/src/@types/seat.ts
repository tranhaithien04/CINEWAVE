export type SeatState = "AVAILABLE" | "HELD" | "SOLD" | "BLOCKED" | "MINE_HELD";

export type SeatType = "STANDARD" | "VIP" | "COUPLE";

export type Seat = {
  id: string;
  row: string;
  number: number;
  type: SeatType;
  state: SeatState;
};
