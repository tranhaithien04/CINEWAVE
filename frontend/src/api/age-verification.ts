import { api } from "./client";

export function submitAgeVerification(body: { passed: boolean; rating?: string; movieSlug?: string }) {
  return api<{ passed: boolean }>("/age-verification", { method: "POST", body });
}
