import { Ticket } from "lucide-react";

import type { Seat } from "@/@types/seat";
import { Button } from "@/components/ui/button";
import { formatVnd, seatPrice } from "@/data/mock-catalog";

export function BookingSummary({
  seats,
  priceBase,
  onContinue,
  pending = false,
  continueLabel = "Tiếp tục",
  pendingLabel = "Đang giữ ghế…",
}: {
  seats: Seat[];
  priceBase: number;
  onContinue: () => void;
  pending?: boolean;
  continueLabel?: string;
  pendingLabel?: string;
}) {
  const total = seats.reduce((sum, seat) => sum + seatPrice(priceBase, seat.type), 0);
  const labels = seats.map((seat) => `${seat.row}${seat.number}`).join(", ");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0c16]/90 p-4 backdrop-blur-md md:static md:rounded-2xl md:border md:bg-cinema-900/70 md:p-6 md:shadow-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            <Ticket className="h-4 w-4 text-cyan-400" strokeWidth={1.75} />
            {seats.length === 0 ? "Chưa chọn ghế" : `${seats.length} ghế`}
          </p>
          <p className="truncate text-xs text-gray-400">{labels || "Xám = trống · lục = đang chọn · vàng = VIP · hồng = đôi"}</p>
          <p className="font-display text-base font-semibold text-cyan-300 md:text-lg">{formatVnd(total)}</p>
        </div>
        <Button
          size="lg"
          className="shrink-0"
          disabled={seats.length === 0 || pending}
          onClick={onContinue}
        >
          {pending ? pendingLabel : continueLabel}
        </Button>
      </div>
    </div>
  );
}
