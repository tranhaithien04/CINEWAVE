import { SeatMapPage } from "@/views/seat-map-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SeatMapPage showtimeId={id} />;
}
