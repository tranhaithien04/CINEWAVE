import jwt from "jsonwebtoken";

export type AccessPayload = {
  sub: string;
  email: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  typ: "access";
};

export type RefreshPayload = {
  sub: string;
  typ: "refresh";
};

function accessSecret() {
  return process.env.JWT_SECRET ?? "cinewave-dev-access-secret";
}

function refreshSecret() {
  return process.env.JWT_REFRESH_SECRET ?? "cinewave-dev-refresh-secret";
}

export function signAccessToken(payload: Omit<AccessPayload, "typ">) {
  return jwt.sign({ ...payload, typ: "access" }, accessSecret(), { expiresIn: "15m" });
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ sub: userId, typ: "refresh" }, refreshSecret(), { expiresIn: "7d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, accessSecret()) as AccessPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret()) as RefreshPayload;
}
