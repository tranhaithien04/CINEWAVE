import { MovieDetailPage } from "@/views/movie-detail-page";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MovieDetailPage slug={slug} />;
}
