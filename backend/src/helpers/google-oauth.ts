import { randomBytes } from "node:crypto";

export type GoogleProfile = {
  googleId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
};

function requiredEnv(name: string) {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new Error(`Thiếu ${name} trong .env`);
  return value;
}

export function googleOAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_CALLBACK_URL?.trim(),
  );
}

export function createGoogleOAuthState() {
  return randomBytes(24).toString("hex");
}

export function buildGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: requiredEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: requiredEnv("GOOGLE_CALLBACK_URL"),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function safeNextPath(raw: unknown) {
  if (typeof raw !== "string") return "/";
  const next = raw.trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  return next;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  const body = new URLSearchParams({
    code,
    client_id: requiredEnv("GOOGLE_CLIENT_ID"),
    client_secret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    redirect_uri: requiredEnv("GOOGLE_CALLBACK_URL"),
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenData = (await tokenRes.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description ?? tokenData.error ?? "Không đổi được mã Google");
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = (await profileRes.json().catch(() => ({}))) as {
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
    picture?: string;
  };
  if (!profileRes.ok || !profile.sub || !profile.email) {
    throw new Error("Không lấy được thông tin tài khoản Google");
  }
  if (profile.email_verified !== true && profile.email_verified !== "true") {
    throw new Error("Email Google chưa được xác minh");
  }

  return {
    googleId: profile.sub,
    email: profile.email.toLowerCase(),
    fullName: profile.name?.trim() || null,
    avatarUrl: profile.picture ?? null,
  };
}
