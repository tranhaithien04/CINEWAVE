import type { Seat } from "@/@types/seat";
import { seatColors } from "@/themes";
import { cn } from "@/utils/cn";
import { isSeatTaken } from "@/utils/seat";

export function SeatButton({
  seat,
  selected,
  onToggle,
}: {
  seat: Seat;
  selected: boolean;
  onToggle: (seat: Seat) => void;
}) {
  const taken = isSeatTaken(seat);

  return (
    <button
      type="button"
      disabled={taken}
      onClick={() => onToggle(seat)}
      title={`${seat.row}${seat.number} · ${seat.type}`}
      className={cn(
        "relative flex h-9 w-8 items-center justify-center rounded-lg border text-[10px] font-semibold transition-[transform,background-color,border-color,color,opacity] duration-200 active:scale-95 md:h-10 md:w-9",
        taken && seat.state === "HELD" && seatColors.HELD,
        taken && seat.state !== "HELD" && seatColors.SOLD,
        !taken && selected && seatColors.SELECTED,
        !taken && !selected && seat.type === "VIP" && seatColors.VIP,
        !taken && !selected && seat.type === "COUPLE" && seatColors.COUPLE,
        !taken && !selected && seat.type === "STANDARD" && seatColors.AVAILABLE,
      )}
    >
      {seat.number}
    </button>
  );
}
