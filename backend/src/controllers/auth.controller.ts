import type { Request, Response } from "express";

import {
  clearAuthCookies,
  clearGoogleOAuthCookies,
  GOOGLE_NEXT_COOKIE,
  GOOGLE_STATE_COOKIE,
  REFRESH_COOKIE,
  setAuthCookies,
  setGoogleOAuthCookies,
} from "../helpers/cookies.js";
import {
  buildGoogleAuthUrl,
  createGoogleOAuthState,
  exchangeGoogleCode,
  googleOAuthConfigured,
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
    res.redirect(frontendUrl("/login?error=google_config"));
    return;
  }
  const state = createGoogleOAuthState();
  const next = safeNextPath(req.query.next);
  setGoogleOAuthCookies(res, state, next);
  res.redirect(buildGoogleAuthUrl(state));
}

export async function googleCallback(req: Request, res: Response) {
  const fail = (code: string) => {
    clearGoogleOAuthCookies(res);
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
    const profile = await exchangeGoogleCode(code);
    const { tokens } = await loginWithGoogle(profile);
    setAuthCookies(res, tokens);
    clearGoogleOAuthCookies(res);
    res.redirect(frontendUrl(next));
  } catch {
    fail("google_failed");
  }
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
