export type ParsedTicketQr = { kind: 'ticket' | 'refund'; code: string; sig?: string };

export function parseTicketQr(raw: string): ParsedTicketQr | null {
  const text = raw.trim();
  if (!text) return null;

  try {
    const url = new URL(text);
    const refundCode = url.searchParams.get('refund');
    const code = refundCode ?? url.searchParams.get('code') ?? url.pathname.split('/').filter(Boolean).pop();
    const sig = url.searchParams.get('s') ?? url.searchParams.get('sig') ?? undefined;
    if (code && /^CW[-A-Z0-9]+$/i.test(code)) {
      const kind = refundCode || url.pathname.includes('/refund') ? 'refund' : 'ticket';
      return { kind, code: code.toUpperCase(), sig };
    }
  } catch {
    /* not a URL */
  }

  const pipe = text.split('|');
  if (pipe[0]?.toUpperCase() === 'CINEWAVE-REFUND' && pipe[1]) {
    return { kind: 'refund', code: pipe[1].trim().toUpperCase(), sig: pipe[2]?.trim() };
  }
  if (pipe[0]?.toUpperCase() === 'CINEWAVE' && pipe[1]) {
    return { kind: 'ticket', code: pipe[1].trim().toUpperCase(), sig: pipe[2]?.trim() };
  }

  if (/^CW[-A-Z0-9]+$/i.test(text)) {
    return { kind: 'ticket', code: text.toUpperCase() };
  }

  return null;
}

export function ticketQrValue(ticket: {
  code: string;
  qr?: { text?: string; sig?: string } | null;
  refundQr?: { text?: string; sig?: string } | null;
  status?: string;
}): string {
  if (ticket.status === 'CANCELLED' && ticket.refundQr?.text) {
    return ticket.refundQr.text;
  }
  if (ticket.qr?.text) return ticket.qr.text;
  if (ticket.qr?.sig) {
    return `CINEWAVE|${ticket.code.toUpperCase()}|${ticket.qr.sig}`;
  }
  return ticket.code;
}
