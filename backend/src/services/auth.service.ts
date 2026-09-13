import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";

import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../helpers/jwt.js";
import { createUser, findUserByEmail, findUserById, updateUser } from "../helpers/user-store.js";
import { DomainError } from "../models/errors.js";
import { toPublicUser } from "../models/user.js";
import { parseLoginInput, parseRegisterInput } from "../validators/auth.js";

async function issueTokens(user: { id: string; email: string; role: "CUSTOMER" | "STAFF" | "ADMIN" }) {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken(user.id);
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await updateUser(user.id, { refreshTokenHash });
  return { accessToken, refreshToken };
}

export async function registerUser(body: unknown) {
  const input = parseRegisterInput(body);
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new DomainError("EMAIL_TAKEN", "Email đã được đăng ký", 409);
  }

  const user = await createUser({
    id: randomUUID(),
    email: input.email,
    password: await bcrypt.hash(input.password, 10),
    fullName: input.fullName,
    role: "CUSTOMER",
    createdAt: new Date().toISOString(),
    refreshTokenHash: null,
  });

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), tokens };
}

export async function loginUser(body: unknown) {
  const input = parseLoginInput(body);
  const user = await findUserByEmail(input.email);
  if (!user || !(await bcrypt.compare(input.password, user.password))) {
    throw new DomainError("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng", 401);
  }

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), tokens };
}

export async function logoutUser(userId?: string) {
  if (userId) {
    await updateUser(userId, { refreshTokenHash: null });
  }
}

export async function refreshSession(refreshToken?: string) {
  if (!refreshToken) {
    throw new DomainError("UNAUTHORIZED", "Chưa đăng nhập", 401);
  }

  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new DomainError("TOKEN_EXPIRED", "Phiên đăng nhập đã hết hạn", 401);
  }

  const user = await findUserById(payload.sub);
  if (!user?.refreshTokenHash) {
    throw new DomainError("UNAUTHORIZED", "Phiên đăng nhập không hợp lệ", 401);
  }

  const matched = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!matched) {
    throw new DomainError("UNAUTHORIZED", "Phiên đăng nhập không hợp lệ", 401);
  }

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), tokens };
}

export async function getCurrentUser(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new DomainError("UNAUTHORIZED", "Không tìm thấy tài khoản", 401);
  }
  return toPublicUser(user);
}
