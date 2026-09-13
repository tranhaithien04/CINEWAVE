import { Skeleton } from "@/components/ui/skeleton";

export function MovieCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-cinema-900/70">
      <Skeleton className="aspect-[2/3] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-3 h-8 w-full rounded-xl" />
      </div>
    </div>
  );
}
