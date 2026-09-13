import type { CookieOptions, Response } from "express";

export const ACCESS_COOKIE = "cw_access";
export const REFRESH_COOKIE = "cw_refresh";

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

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie, maxAge: 0 });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie, maxAge: 0 });
}
