import type { CookieOptions, Response } from "express";

export const ACCESS_COOKIE = "cw_access";
export const REFRESH_COOKIE = "cw_refresh";
export const GOOGLE_STATE_COOKIE = "cw_google_state";
export const GOOGLE_NEXT_COOKIE = "cw_google_next";
export const GOOGLE_MOBILE_COOKIE = "cw_google_mobile";
export const GOOGLE_REDIRECT_COOKIE = "cw_google_redirect";

/** Vercel (*.vercel.app) + Render (*.onrender.com) = cross-site → cần SameSite=None; Secure. */
function resolveSameSite(): CookieOptions["sameSite"] {
  const raw = process.env.COOKIE_SAMESITE?.trim().toLowerCase();
  if (raw === "none" || raw === "lax" || raw === "strict") return raw;
  // Khác parent domain (không set COOKIE_DOMAIN) trên production → cross-site
  if (process.env.NODE_ENV === "production" && !process.env.COOKIE_DOMAIN?.trim()) {
    return "none";
  }
  return "lax";
}

export const baseCookie: CookieOptions = {
  httpOnly: true,
  sameSite: resolveSameSite(),
  secure: process.env.NODE_ENV === "production" || resolveSameSite() === "none",
  path: "/",
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
};

export function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...baseCookie, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...baseCookie, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function setGoogleOAuthCookies(res: Response, state: string, nextPath: string) {
  res.cookie(GOOGLE_STATE_COOKIE, state, { ...baseCookie, maxAge: 10 * 60 * 1000 });
  res.cookie(GOOGLE_NEXT_COOKIE, nextPath, { ...baseCookie, maxAge: 10 * 60 * 1000 });
}

export function clearGoogleOAuthCookies(res: Response) {
  res.clearCookie(GOOGLE_STATE_COOKIE, { ...baseCookie, maxAge: 0 });
  res.clearCookie(GOOGLE_NEXT_COOKIE, { ...baseCookie, maxAge: 0 });
  res.clearCookie(GOOGLE_MOBILE_COOKIE, { ...baseCookie, maxAge: 0 });
  res.clearCookie(GOOGLE_REDIRECT_COOKIE, { ...baseCookie, maxAge: 0 });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie, maxAge: 0 });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie, maxAge: 0 });
}
