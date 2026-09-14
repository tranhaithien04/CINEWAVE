"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { refundQrUrl, ticketGateUrl } from "@/utils/ticket-qr";
import { cn } from "@/utils/cn";

export function TicketQr({
  code,
  sig,
  size = 160,
  used = false,
  mode = "ticket",
  stamp,
  className,
}: {
  code: string;
  sig?: string | null;
  size?: number;
  used?: boolean;
  mode?: "ticket" | "refund";
  stamp?: string | null;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const value = mode === "refund" ? refundQrUrl(code, sig) : ticketGateUrl(code, sig);
    void QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#09090b", light: "#ffffff" },
    }).then(setSrc);
  }, [code, sig, size, mode]);

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-white p-2", used && "opacity-50 grayscale", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={mode === "refund" ? `QR hoàn tiền ${code}` : `Mã QR vé ${code}`}
          width={size}
          height={size}
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="animate-pulse rounded-lg bg-zinc-200" style={{ width: size, height: size }} />
      )}
      {stamp ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <span className="rotate-[-18deg] rounded-md border-2 border-zinc-800 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-zinc-800">
            {stamp}
          </span>
        </div>
      ) : used ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <span className="rotate-[-18deg] rounded-md border-2 border-zinc-800 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-zinc-800">
            Đã dùng
          </span>
        </div>
      ) : null}
    </div>
  );
}
