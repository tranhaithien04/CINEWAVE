export type BookingDraft = {
  showtimeId: string | null;
  seatIds: string[];
};

export const emptyBookingDraft: BookingDraft = {
  showtimeId: null,
  seatIds: [],
};
