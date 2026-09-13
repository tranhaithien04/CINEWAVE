export const envKeys = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "AI_SERVICE_URL",
  "AI_SERVICE_KEY",
  "HOLD_TTL_SECONDS",
  "PAYMENT_PROVIDER",
] as const;

export type EnvKey = (typeof envKeys)[number];
