import { SeatMapPage } from "@/views/seat-map-page";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ticket?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return <SeatMapPage showtimeId={id} changeTicket={query.ticket} />;
}
