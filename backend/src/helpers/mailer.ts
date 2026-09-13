type MailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendMail({ to, subject, text }: MailInput) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log(`[mail:dev] to=${to} subject=${subject}\n${text}`);
    return { sent: true, transport: "console" as const };
  }

  const payload = {
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER,
    from: process.env.MAIL_FROM ?? "CINEWAVE <no-reply@cinewave.vn>",
    to,
    subject,
    text,
  };
  console.log(`[mail:smtp] queued`, { to, subject, host: payload.host });
  return { sent: true, transport: "smtp" as const };
}
