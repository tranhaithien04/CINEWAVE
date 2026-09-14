import { Suspense } from "react";

import { GatePage } from "@/views/gate-page";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-16 text-sm text-muted-foreground">Đang mở cổng soát vé…</main>
      }
    >
      <GatePage code={code} />
    </Suspense>
  );
}
