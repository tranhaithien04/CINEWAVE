import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return process.env.JWT_SECRET ?? "cinewave-dev-access-secret";
}

export function ticketQrSig(code: string) {
  const normalized = code.trim().toUpperCase();
  return createHmac("sha256", secret()).update(`cw-ticket:${normalized}`).digest("hex").slice(0, 16);
}

export function verifyTicketQrSig(code: string, sig: string | null | undefined) {
  const expected = ticketQrSig(code);
  const got = String(sig ?? "")
    .trim()
    .toLowerCase();
  if (got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(got));
}

export function ticketQrPayload(code: string) {
  const normalized = code.trim().toUpperCase();
  const sig = ticketQrSig(normalized);
  return {
    code: normalized,
    sig,
    text: `CINEWAVE|${normalized}|${sig}`,
  };
}

export function refundQrSig(code: string) {
  const normalized = code.trim().toUpperCase();
  return createHmac("sha256", secret()).update(`cw-refund:${normalized}`).digest("hex").slice(0, 16);
}

export function verifyRefundQrSig(code: string, sig: string | null | undefined) {
  const expected = refundQrSig(code);
  const got = String(sig ?? "")
    .trim()
    .toLowerCase();
  if (!got || got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(got));
}

export function refundQrPayload(code: string) {
  const normalized = code.trim().toUpperCase();
  const sig = refundQrSig(normalized);
  return {
    code: normalized,
    sig,
    text: `CINEWAVE-REFUND|${normalized}|${sig}`,
  };
}

export function detectQrKind(code: string, sig: string | null | undefined): "ticket" | "refund" {
  if (sig && verifyRefundQrSig(code, sig)) return "refund";
  return "ticket";
}
