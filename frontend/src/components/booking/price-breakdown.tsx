import type { Seat } from "@/@types/seat";
import { Separator } from "@/components/ui/separator";
import { formatVnd, seatPrice } from "@/data/mock-catalog";

export function PriceBreakdown({ seats, priceBase }: { seats: { id?: string; label: string; type: Seat["type"] }[]; priceBase: number }) {
  const lines = seats.map((seat) => ({
    label: seat.label,
    type: seat.type,
    price: seatPrice(priceBase, seat.type),
  }));
  const total = lines.reduce((sum, line) => sum + line.price, 0);

  return (
    <div className="space-y-3 text-sm">
      {lines.length === 0 ? <p className="text-muted-foreground">Chưa có ghế.</p> : null}
      {lines.map((line) => (
        <div key={line.label} className="flex justify-between text-muted-foreground">
          <span>
            {line.label} · {line.type}
          </span>
          <span>{formatVnd(line.price)}</span>
        </div>
      ))}
      <Separator />
      <div className="flex justify-between text-base font-semibold">
        <span>Tổng</span>
        <span className="font-display text-cyan-300">{formatVnd(total)}</span>
      </div>
    </div>
  );
}
