import type { Request, Response } from "express";

import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "../helpers/cookies.js";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from "../services/auth.service.js";

export async function register(req: Request, res: Response) {
  const { user, tokens } = await registerUser(req.body);
  setAuthCookies(res, tokens);
  res.status(201).json({ user, tokens });
}

export async function login(req: Request, res: Response) {
  const { user, tokens } = await loginUser(req.body);
  setAuthCookies(res, tokens);
  res.status(200).json({ user, tokens });
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
