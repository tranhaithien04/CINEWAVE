import { RoomLayoutModel } from "../db/models.js";
import {
  createDefaultRoomSeats,
  normalizeRoomSeats,
  type RoomSeatDef,
  type SeatType,
} from "./seat-pricing.js";

export type { RoomSeatDef };

export type RoomLayoutRecord = {
  id: string;
  cinema: string;
  room: string;
  seats: RoomSeatDef[];
  updatedAt: string;
};

export function roomLayoutId(cinema: string, room: string) {
  return `${cinema.trim()}::${room.trim()}`;
}

export async function getRoomLayout(cinema: string, room: string): Promise<RoomLayoutRecord> {
  const id = roomLayoutId(cinema, room);
  const doc = await RoomLayoutModel.findOne({ id }).lean();
  if (doc) {
    return {
      id: doc.id,
      cinema: doc.cinema,
      room: doc.room,
      seats: (doc.seats ?? []).map((seat) => ({
        label: String(seat.label).toUpperCase(),
        row: String(seat.row).toUpperCase(),
        number: Number(seat.number),
        type: seat.type as SeatType,
        partner: seat.partner ? String(seat.partner).toUpperCase() : null,
      })),
      updatedAt: doc.updatedAt,
    };
  }
  return {
    id,
    cinema: cinema.trim(),
    room: room.trim(),
    seats: createDefaultRoomSeats(),
    updatedAt: new Date(0).toISOString(),
  };
}

export async function saveRoomLayout(input: {
  cinema: string;
  room: string;
  seats: RoomSeatDef[];
}): Promise<RoomLayoutRecord> {
  const id = roomLayoutId(input.cinema, input.room);
  const updatedAt = new Date().toISOString();
  const record: RoomLayoutRecord = {
    id,
    cinema: input.cinema.trim(),
    room: input.room.trim(),
    seats: normalizeRoomSeats(input.seats),
    updatedAt,
  };
  await RoomLayoutModel.findOneAndUpdate({ id }, record, { upsert: true, new: true });
  return record;
}
