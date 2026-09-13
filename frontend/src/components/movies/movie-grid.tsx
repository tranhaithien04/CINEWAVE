import type { Movie } from "@/@types/movie";
import { MovieCard } from "@/components/movies/movie-card";
import { MovieCardSkeleton } from "@/components/movies/movie-card-skeleton";
import { EmptyState, ErrorState } from "@/components/shared/state-views";

export function MovieGrid({
  movies,
  loading,
  error,
  onRetry,
}: {
  movies: Movie[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const list = movies ?? [];
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <MovieCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (list.length === 0) {
    return <EmptyState title="Chưa có phim phù hợp" description="Thử đổi bộ lọc độ tuổi hoặc xem lại sau." />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {list.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
