import type { ConcessionLine } from "@/api/admin";
import type { Seat } from "@/@types/seat";
import { Separator } from "@/components/ui/separator";
import { formatVnd, seatPrice } from "@/data/mock-catalog";

export function PriceBreakdown({
  seats,
  priceBase,
  concessions = [],
}: {
  seats: { id?: string; label: string; type: Seat["type"] }[];
  priceBase: number;
  concessions?: ConcessionLine[];
}) {
  const lines = seats.map((seat) => ({
    label: seat.label,
    type: seat.type,
    price: seatPrice(priceBase, seat.type),
  }));
  const seatTotal = lines.reduce((sum, line) => sum + line.price, 0);
  const comboTotal = concessions.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  const total = seatTotal + comboTotal;

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
      {concessions.map((line) => (
        <div key={line.id} className="flex justify-between text-amber-200/80">
          <span>
            {line.name} × {line.qty}
          </span>
          <span>{formatVnd(line.unitPrice * line.qty)}</span>
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
