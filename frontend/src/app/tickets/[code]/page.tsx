import { TicketDetailPage } from "@/views/ticket-detail-page";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <TicketDetailPage code={code} />;
}
