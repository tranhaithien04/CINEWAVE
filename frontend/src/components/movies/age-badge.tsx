import type { AgeRating } from "@/@types/movie";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

const ratingClass: Record<AgeRating, string> = {
  P: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  K: "border-blue-500/30 bg-blue-500/15 text-blue-400",
  T13: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  T16: "border-orange-500/30 bg-orange-500/15 text-orange-400",
  T18: "border-rose-500/30 bg-rose-500/15 text-rose-400",
};

export function AgeBadge({ rating, className }: { rating: AgeRating; className?: string }) {
  return (
    <Badge
      className={cn(
        "rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide backdrop-blur-md",
        ratingClass[rating],
        className,
      )}
    >
      {rating}
    </Badge>
  );
}
