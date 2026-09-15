import type { CookieOptions, Response } from "express";

export const ACCESS_COOKIE = "cw_access";
export const REFRESH_COOKIE = "cw_refresh";
export const GOOGLE_STATE_COOKIE = "cw_google_state";
export const GOOGLE_NEXT_COOKIE = "cw_google_next";
export const GOOGLE_MOBILE_COOKIE = "cw_google_mobile";
export const GOOGLE_REDIRECT_COOKIE = "cw_google_redirect";

const baseCookie: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
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
