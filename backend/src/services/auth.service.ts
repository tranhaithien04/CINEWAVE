import { createHash, randomBytes, randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";

import type { GoogleProfile } from "../helpers/google-oauth.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../helpers/jwt.js";
import { appBaseUrl, sendMail } from "../helpers/mailer.js";
import {
  createUser,
  findUserByEmail,
  findUserByEmailVerifyTokenHash,
  findUserByGoogleId,
  findUserById,
  updateUser,
} from "../helpers/user-store.js";
import { DomainError } from "../models/errors.js";
import type { UserRecord } from "../models/user.js";
import { toPublicUser } from "../models/user.js";
import { parseLoginInput, parseRegisterInput } from "../validators/auth.js";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

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

function assertEmailVerified(user: UserRecord) {
  if (user.googleId || user.emailVerifiedAt) return;
  throw new DomainError(
    "EMAIL_NOT_VERIFIED",
    "Email chưa được xác minh. Vui lòng mở link trong hộp thư hoặc gửi lại email xác minh.",
    403,
  );
}

async function issueEmailVerification(user: UserRecord) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MS).toISOString();
  await updateUser(user.id, {
    emailVerifyTokenHash: hashToken(token),
    emailVerifyExpiresAt: expiresAt,
  });

  const verifyUrl = `${appBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const text = [
    `Xin chào ${user.fullName || user.email},`,
    "",
    "Cảm ơn bạn đã đăng ký CINEWAVE.",
    "Vui lòng xác minh email bằng liên kết sau (hiệu lực 24 giờ):",
    verifyUrl,
    "",
    "Nếu bạn không tạo tài khoản, hãy bỏ qua email này.",
  ].join("\n");

  const mail = await sendMail({
    to: user.email,
    subject: "[CINEWAVE] Xác minh email đăng ký",
    text,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h2>Xác minh email CINEWAVE</h2>
        <p>Xin chào <strong>${user.fullName || user.email}</strong>,</p>
        <p>Nhấn nút bên dưới để kích hoạt tài khoản (hiệu lực 24 giờ):</p>
        <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;background:#0891b2;color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Xác minh email</a></p>
        <p style="font-size:12px;color:#64748b">Hoặc mở link:<br/>${verifyUrl}</p>
      </div>
    `,
  });

  return {
    email: user.email,
    expiresAt,
    mailStatus: mail.transport,
  };
}

export async function registerUser(body: unknown) {
  const input = parseRegisterInput(body);
  const existing = await findUserByEmail(input.email);
  if (existing) {
    if (!existing.emailVerifiedAt && !existing.googleId) {
      const issued = await issueEmailVerification(existing);
      return {
        pendingVerification: true as const,
        email: existing.email,
        message:
          issued.mailStatus === "console-fallback"
            ? "Email đã đăng ký nhưng chưa xác minh. Không gửi được mail (SMTP lỗi) — kiểm tra App Password Gmail hoặc xem log backend để lấy link."
            : "Email đã đăng ký nhưng chưa xác minh. Đã gửi lại link xác minh.",
      };
    }
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
    emailVerifiedAt: null,
    emailVerifyTokenHash: null,
    emailVerifyExpiresAt: null,
  });

  const issued = await issueEmailVerification(user);
  return {
    pendingVerification: true as const,
    email: user.email,
    message:
      issued.mailStatus === "console-fallback"
        ? "Đăng ký thành công nhưng chưa gửi được email xác minh (SMTP lỗi). Kiểm tra App Password Gmail hoặc xem log backend để lấy link."
        : "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.",
  };
}

export async function verifyEmailToken(tokenRaw: unknown) {
  const token = typeof tokenRaw === "string" ? tokenRaw.trim() : "";
  if (!token) throw new DomainError("INVALID_VERIFY_TOKEN", "Token xác minh không hợp lệ", 400);

  const user = await findUserByEmailVerifyTokenHash(hashToken(token));
  if (!user) throw new DomainError("INVALID_VERIFY_TOKEN", "Link xác minh không hợp lệ hoặc đã dùng", 400);

  const exp = user.emailVerifyExpiresAt ? new Date(user.emailVerifyExpiresAt).getTime() : 0;
  if (!exp || exp < Date.now()) {
    throw new DomainError("INVALID_VERIFY_TOKEN", "Link xác minh đã hết hạn. Hãy gửi lại email.", 400);
  }

  const verified =
    (await updateUser(user.id, {
      emailVerifiedAt: new Date().toISOString(),
      emailVerifyTokenHash: null,
      emailVerifyExpiresAt: null,
    })) ?? user;

  const tokens = await issueTokens(verified);
  return { user: toPublicUser(verified), tokens };
}

export async function resendVerificationEmail(body: unknown) {
  const email =
    body && typeof body === "object" && typeof (body as { email?: unknown }).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";
  if (!email) throw new DomainError("VALIDATION_ERROR", "Email không hợp lệ");

  const user = await findUserByEmail(email);
  if (user && !user.emailVerifiedAt && !user.googleId) {
    await issueEmailVerification(user);
  }
  return { ok: true, message: "Nếu email hợp lệ và chưa xác minh, link mới đã được gửi." };
}

export async function loginUser(body: unknown) {
  const input = parseLoginInput(body);
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new DomainError("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng", 401);
  }
  if (!user.password) {
    throw new DomainError("INVALID_CREDENTIALS", "Tài khoản này đăng nhập bằng Google", 401);
  }
  if (!(await bcrypt.compare(input.password, user.password))) {
    throw new DomainError("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng", 401);
  }
  assertEmailVerified(user);

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), tokens };
}

export async function loginWithGoogle(profile: GoogleProfile) {
  let user =
    (await findUserByGoogleId(profile.googleId)) ?? (await findUserByEmail(profile.email));

  if (!user) {
    user = await createUser({
      id: randomUUID(),
      email: profile.email,
      password: null,
      fullName: profile.fullName,
      role: "CUSTOMER",
      createdAt: new Date().toISOString(),
      refreshTokenHash: null,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
      emailVerifiedAt: new Date().toISOString(),
      emailVerifyTokenHash: null,
      emailVerifyExpiresAt: null,
    } satisfies UserRecord);
  } else {
    const patch: Partial<UserRecord> = {
      googleId: user.googleId ?? profile.googleId,
      avatarUrl: profile.avatarUrl ?? user.avatarUrl ?? null,
      emailVerifiedAt: user.emailVerifiedAt ?? new Date().toISOString(),
      emailVerifyTokenHash: null,
      emailVerifyExpiresAt: null,
    };
    if (!user.fullName && profile.fullName) patch.fullName = profile.fullName;
    user = (await updateUser(user.id, patch)) ?? user;
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

  assertEmailVerified(user);
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
