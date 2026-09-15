import type { Request, Response } from "express";

import {
  clearAuthCookies,
  clearGoogleOAuthCookies,
  GOOGLE_MOBILE_COOKIE,
  GOOGLE_NEXT_COOKIE,
  GOOGLE_REDIRECT_COOKIE,
  GOOGLE_STATE_COOKIE,
  REFRESH_COOKIE,
  setAuthCookies,
  setGoogleOAuthCookies,
} from "../helpers/cookies.js";
import {
  consumeMobileGoogleTicket,
  createMobileGoogleTicket,
} from "../helpers/mobile-google-ticket.js";
import {
  buildGoogleAuthUrl,
  createGoogleOAuthState,
  exchangeGoogleCode,
  googleOAuthConfigured,
  isAllowedMobileGoogleRedirectUri,
  resolveGoogleRedirectUri,
  safeNextPath,
} from "../helpers/google-oauth.js";
import {
  getCurrentUser,
  loginUser,
  loginWithGoogle,
  logoutUser,
  refreshSession,
  registerUser,
  resendVerificationEmail,
  verifyEmailToken,
} from "../services/auth.service.js";

function frontendUrl(path = "/") {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Web: cookies. Mobile: tokens in JSON body. Register may return pendingVerification (no session). */
export async function register(req: Request, res: Response) {
  const result = await registerUser(req.body);
  if ("user" in result && "tokens" in result) {
    setAuthCookies(res, result.tokens);
    res.status(201).json({ user: result.user, tokens: result.tokens });
    return;
  }
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const { user, tokens } = await loginUser(req.body);
  setAuthCookies(res, tokens);
  res.status(200).json({ user, tokens });
}

export async function verifyEmail(req: Request, res: Response) {
  const token = typeof req.body?.token === "string" ? req.body.token : req.query.token;
  const { user, tokens } = await verifyEmailToken(token);
  setAuthCookies(res, tokens);
  res.status(200).json({ user, tokens, verified: true });
}

export async function resendVerification(req: Request, res: Response) {
  res.json(await resendVerificationEmail(req.body));
}

export function googleStart(req: Request, res: Response) {
  if (!googleOAuthConfigured()) {
    if (req.query.platform === "mobile") {
      res.status(503).json({ code: "GOOGLE_CONFIG", message: "Chưa cấu hình Google OAuth." });
      return;
    }
    res.redirect(frontendUrl("/login?error=google_config"));
    return;
  }
  const state = createGoogleOAuthState();
  const isMobile = req.query.platform === "mobile";
  const next = isMobile ? "__mobile__" : safeNextPath(req.query.next);
  const redirectUri = resolveGoogleRedirectUri(req, isMobile);

  setGoogleOAuthCookies(res, state, next);
  res.cookie(GOOGLE_REDIRECT_COOKIE, redirectUri, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60 * 1000,
  });
  if (isMobile) {
    res.cookie(GOOGLE_MOBILE_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60 * 1000,
    });
  }
  res.redirect(buildGoogleAuthUrl(state, redirectUri));
}

export function googleMobileStatus(_req: Request, res: Response) {
  res.status(200).json({ configured: googleOAuthConfigured() });
}

/** Mobile / Expo: exchange OAuth code + redirectUri for JWT tokens (no cookies). */
export async function googleMobile(req: Request, res: Response) {
  if (!googleOAuthConfigured()) {
    res.status(503).json({
      code: "GOOGLE_CONFIG",
      message: "Chưa cấu hình Google OAuth trên server.",
    });
    return;
  }

  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  const redirectUri = typeof req.body?.redirectUri === "string" ? req.body.redirectUri.trim() : "";

  if (!code || !redirectUri) {
    res.status(400).json({ code: "VALIDATION", message: "Thiếu code hoặc redirectUri." });
    return;
  }

  if (!isAllowedMobileGoogleRedirectUri(redirectUri)) {
    res.status(400).json({ code: "VALIDATION", message: "redirectUri không được phép." });
    return;
  }

  try {
    const profile = await exchangeGoogleCode(code, redirectUri);
    const { user, tokens } = await loginWithGoogle(profile);
    res.status(200).json({ user, tokens });
  } catch (error) {
    res.status(401).json({
      code: "GOOGLE_FAILED",
      message: error instanceof Error ? error.message : "Không đăng nhập được bằng Google",
    });
  }
}

export async function googleCallback(req: Request, res: Response) {
  const isMobile =
    req.cookies?.[GOOGLE_MOBILE_COOKIE] === "1" ||
    String(req.cookies?.[GOOGLE_NEXT_COOKIE] ?? "") === "__mobile__";

  const fail = (code: string) => {
    clearGoogleOAuthCookies(res);
    if (isMobile) {
      res.redirect(`/auth/google/mobile-done?error=${encodeURIComponent(code)}`);
      return;
    }
    res.redirect(frontendUrl(`/login?error=${encodeURIComponent(code)}`));
  };

  const returnedState = String(req.query.state ?? "");
  const expectedState = String(req.cookies?.[GOOGLE_STATE_COOKIE] ?? "");
  const next = safeNextPath(req.cookies?.[GOOGLE_NEXT_COOKIE]);
  const code = String(req.query.code ?? "");

  if (req.query.error || !code || !returnedState || !expectedState || returnedState !== expectedState) {
    fail("google_denied");
    return;
  }

  try {
    const redirectUri =
      typeof req.cookies?.[GOOGLE_REDIRECT_COOKIE] === "string" && req.cookies[GOOGLE_REDIRECT_COOKIE]
        ? String(req.cookies[GOOGLE_REDIRECT_COOKIE])
        : undefined;
    const profile = await exchangeGoogleCode(code, redirectUri);
    const session = await loginWithGoogle(profile);
    clearGoogleOAuthCookies(res);

    if (isMobile) {
      const ticket = createMobileGoogleTicket(session);
      res.redirect(`/auth/google/mobile-done?ticket=${encodeURIComponent(ticket)}`);
      return;
    }

    setAuthCookies(res, session.tokens);
    res.redirect(frontendUrl(next));
  } catch {
    fail("google_failed");
  }
}

export function googleMobileDone(req: Request, res: Response) {
  const ticket = typeof req.query.ticket === "string" ? req.query.ticket : "";
  const error = typeof req.query.error === "string" ? req.query.error : "";
  const ok = Boolean(ticket) && !error;
  res.status(200).type("html").send(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CineWave Google</title>
  <style>
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:#06070d;color:#e2e8f0;font-family:system-ui,sans-serif;padding:24px;text-align:center}
    .card{max-width:360px}
    h1{font-size:20px;margin:0 0 8px}
    p{font-size:14px;color:#94a3b8;margin:0}
  </style>
</head>
<body>
  <div class="card" data-cinewave-google="${ok ? "ok" : "error"}"
       data-ticket="${ticket.replace(/"/g, "")}" data-error="${error.replace(/"/g, "")}">
    <h1>${ok ? "Đăng nhập Google thành công" : "Đăng nhập Google thất bại"}</h1>
    <p>${ok ? "Đang quay lại ứng dụng CineWave…" : "Đóng cửa sổ và thử lại trong app."}</p>
  </div>
</body>
</html>`);
}

export function googleMobileTicket(req: Request, res: Response) {
  const ticket = typeof req.body?.ticket === "string" ? req.body.ticket.trim() : "";
  if (!ticket) {
    res.status(400).json({ code: "VALIDATION", message: "Thiếu ticket." });
    return;
  }
  const payload = consumeMobileGoogleTicket(ticket);
  if (!payload) {
    res.status(401).json({ code: "TICKET_EXPIRED", message: "Phiên Google đã hết hạn. Thử lại." });
    return;
  }
  res.status(200).json({ user: payload.user, tokens: payload.tokens });
}

export async function logout(req: Request, res: Response) {
  await logoutUser(req.userId);
  clearAuthCookies(res);
  res.status(200).json({ ok: true });
}

export async function refresh(req: Request, res: Response) {
  const token = req.body?.refreshToken || req.cookies?.[REFRESH_COOKIE];
  const { user, tokens } = await refreshSession(token);
  setAuthCookies(res, tokens);
  res.status(200).json({ user, tokens });
}

export async function me(req: Request, res: Response) {
  const user = await getCurrentUser(req.userId!);
  res.status(200).json({ user });
}
