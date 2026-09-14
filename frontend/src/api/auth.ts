import { api } from "./client";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  emailVerified?: boolean;
};

type AuthResponse = { user: AuthUser };

export type RegisterResponse =
  | AuthResponse
  | {
      pendingVerification: true;
      email: string;
      message: string;
    };

export function registerAccount(input: { email: string; password: string; fullName: string }) {
  return api<RegisterResponse>("/auth/register", { method: "POST", body: input });
}

export function loginAccount(input: { email: string; password: string }) {
  return api<AuthResponse>("/auth/login", { method: "POST", body: input });
}

export function verifyEmailToken(token: string) {
  return api<{ user: AuthUser; verified: boolean }>("/auth/verify-email", {
    method: "POST",
    body: { token },
  });
}

export function resendVerificationEmail(email: string) {
  return api<{ ok: boolean; message: string }>("/auth/resend-verification", {
    method: "POST",
    body: { email },
  });
}

export function logoutAccount() {
  return api<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

export function fetchMe() {
  return api<AuthResponse>("/auth/me");
}

export function refreshSession() {
  return api<AuthResponse>("/auth/refresh", { method: "POST" });
}
