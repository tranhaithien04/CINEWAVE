import { StaffScanPage } from "@/views/staff-scan-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ refund?: string; s?: string; sig?: string }>;
}) {
  const query = await searchParams;
  return <StaffScanPage initialRefund={query.refund} initialSig={query.s ?? query.sig} />;
}
