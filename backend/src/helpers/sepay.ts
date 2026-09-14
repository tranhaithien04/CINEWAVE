import { createHmac, timingSafeEqual } from "node:crypto";

export type SepayWebhookPayload = {
  id?: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string;
  code?: string | null;
  content?: string;
  transferType?: string;
  description?: string;
  transferAmount?: number;
  referenceCode?: string;
};

export type SepayQrInfo = {
  provider: "SEPAY" | "MOCK";
  qrUrl: string;
  bank: string;
  bankLabel: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  content: string;
  expiresAt: string;
};

function env(name: string, fallback = "") {
  return (process.env[name] ?? fallback).trim();
}

export function paymentProvider(): "SEPAY" | "MOCK" {
  const explicit = env("PAYMENT_PROVIDER").toUpperCase();
  if (explicit === "MOCK") return "MOCK";
  if (env("SEPAY_ACCOUNT_NUMBER")) return "SEPAY";
  return explicit === "SEPAY" ? "SEPAY" : "MOCK";
}

export function sepayConfig() {
  return {
    accountNumber: env("SEPAY_ACCOUNT_NUMBER"),
    bank: env("SEPAY_BANK", "MBBank"),
    bankLabel: env("SEPAY_BANK_LABEL", "MB Bank (Ngân hàng TMCP Quân đội)"),
    accountName: env("SEPAY_ACCOUNT_NAME", "CINEWAVE"),
    apiKey: env("SEPAY_WEBHOOK_API_KEY"),
    hmacSecret: env("SEPAY_WEBHOOK_SECRET"),
    qrBase: env("SEPAY_QR_BASE", "https://qr.sepay.vn/img"),
  };
}

export function transferMemo(paymentCode: string): string {
  const bank = sepayConfig().bank.toLowerCase();
  if (bank.includes("vietin") && !paymentCode.toUpperCase().includes("SEVQR")) {
    return `SEVQR ${paymentCode}`;
  }
  return paymentCode;
}

export function buildSepayQrUrl(content: string, amount: number): string {
  const cfg = sepayConfig();
  const memo = transferMemo(content);
  const params = new URLSearchParams({
    acc: cfg.accountNumber,
    bank: cfg.bank,
    amount: String(Math.max(0, Math.round(amount))),
    des: memo,
    template: "compact",
  });
  return `${cfg.qrBase}?${params.toString()}`;
}

export function buildPaymentView(content: string, amount: number, expiresAt: string): SepayQrInfo {
  const cfg = sepayConfig();
  const provider = paymentProvider();
  const accountNumber = cfg.accountNumber || "0000000000";
  const memo = transferMemo(content);
  return {
    provider,
    qrUrl: cfg.accountNumber ? buildSepayQrUrl(content, amount) : "",
    bank: cfg.bank,
    bankLabel: cfg.bankLabel,
    accountNumber,
    accountName: cfg.accountName,
    amount: Math.round(amount),
    content: memo,
    expiresAt,
  };
}

export function extractPaymentCode(payload: SepayWebhookPayload): string | null {
  const direct = String(payload.code ?? "").trim();
  if (direct) return direct.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const haystack = `${payload.content ?? ""} ${payload.description ?? ""}`;
  const match = haystack.toUpperCase().match(/CW[A-Z0-9]{6,}/);
  return match?.[0] ?? null;
}

function headerValue(headers: Record<string, unknown>, name: string): string {
  const key = Object.keys(headers).find((item) => item.toLowerCase() === name.toLowerCase());
  const value = key ? headers[key] : undefined;
  if (Array.isArray(value)) return String(value[0] ?? "");
  return value == null ? "" : String(value);
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifySepayWebhook(headers: Record<string, unknown>, rawBody?: Buffer): boolean {
  const cfg = sepayConfig();
  if (cfg.hmacSecret) {
    const signature = headerValue(headers, "x-sepay-signature");
    const timestamp = headerValue(headers, "x-sepay-timestamp");
    if (!signature || !timestamp || !rawBody) return false;
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;
    const expected = `sha256=${createHmac("sha256", cfg.hmacSecret).update(`${timestamp}.${rawBody.toString("utf8")}`).digest("hex")}`;
    return safeEqual(expected, signature);
  }

  if (cfg.apiKey) {
    const auth = headerValue(headers, "authorization");
    const expected = `Apikey ${cfg.apiKey}`;
    return safeEqual(auth, expected);
  }

  return paymentProvider() === "MOCK";
}
