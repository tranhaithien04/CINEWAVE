import nodemailer, { type Transporter } from "nodemailer";

import { getRuntimeEnvSync } from "./system-settings.js";

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type MailResult = {
  sent: boolean;
  transport: "smtp" | "console" | "console-fallback";
  error?: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

let cachedTransporter: Transporter | null = null;
let cachedTransporterKey = "";

function smtpConfig(): SmtpConfig {
  const host = getRuntimeEnvSync("SMTP_HOST", process.env.SMTP_HOST ?? "").trim();
  const port = Number(getRuntimeEnvSync("SMTP_PORT", process.env.SMTP_PORT ?? "587") || 587);
  const user = getRuntimeEnvSync("SMTP_USER", process.env.SMTP_USER ?? "").trim();
  // Gmail App Password may be pasted with spaces — strip them.
  const pass = getRuntimeEnvSync("SMTP_PASS", process.env.SMTP_PASS ?? "").replace(/\s+/g, "");
  const from =
    getRuntimeEnvSync("MAIL_FROM", process.env.MAIL_FROM ?? "").trim() ||
    "CINEWAVE <no-reply@cinewave.vn>";
  return { host, port, user, pass, from };
}

function getSmtpTransporter(cfg: SmtpConfig): Transporter {
  const key = `${cfg.host}|${cfg.port}|${cfg.user}|${cfg.pass}`;
  if (cachedTransporter && cachedTransporterKey === key) return cachedTransporter;

  // Render/Docker often resolves smtp.gmail.com to IPv6 first; many hosts
  // cannot route IPv6 → ENETUNREACH. Force IPv4 for outbound SMTP.
  cachedTransporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    requireTLS: cfg.port === 587,
    family: 4,
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
    auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });
  cachedTransporterKey = key;
  return cachedTransporter;
}

function logMailDev(to: string, subject: string, text: string, reason?: string) {
  const prefix = reason ? `[mail:fallback ${reason}]` : "[mail:dev]";
  console.log(`${prefix} to=${to} subject=${subject}\n${text}`);
}

export async function sendMail({ to, subject, text, html }: MailInput): Promise<MailResult> {
  const cfg = smtpConfig();

  if (!cfg.host) {
    logMailDev(to, subject, text);
    return { sent: true, transport: "console" };
  }

  try {
    const transporter = getSmtpTransporter(cfg);

    await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      html: html ?? undefined,
    });

    return { sent: true, transport: "smtp" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP send failed";
    console.error(`[mail:smtp-error] ${message}`);
    // Drop cached transporter so the next send rebuilds after credential/config changes.
    cachedTransporter = null;
    cachedTransporterKey = "";
    logMailDev(to, subject, text, "smtp-failed");
    // Do not crash register/payment flows when mail provider rejects credentials.
    return { sent: false, transport: "console-fallback", error: message };
  }
}

export function appBaseUrl() {
  return getRuntimeEnvSync(
    "NEXT_PUBLIC_APP_URL",
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ).replace(/\/$/, "");
}
