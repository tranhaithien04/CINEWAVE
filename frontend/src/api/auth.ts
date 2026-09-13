import { api } from "./client";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
};

type AuthResponse = { user: AuthUser };

export function registerAccount(input: { email: string; password: string; fullName: string }) {
  return api<AuthResponse>("/auth/register", { method: "POST", body: input });
}

export function loginAccount(input: { email: string; password: string }) {
  return api<AuthResponse>("/auth/login", { method: "POST", body: input });
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
