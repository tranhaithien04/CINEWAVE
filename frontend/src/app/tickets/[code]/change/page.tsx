import { ChangeShowtimePage } from "@/views/change-showtime-page";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ChangeShowtimePage code={code} />;
}
