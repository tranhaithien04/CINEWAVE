import { readJsonFile, writeJsonFile } from "./json-store.js";

export type SettingSensitivity = "public" | "secret" | "locked";

export type SettingDef = {
  key: string;
  group: string;
  label: string;
  description: string;
  sensitivity: SettingSensitivity;
  /** Can be changed via Admin API */
  editable: boolean;
  /** Hot-applied at runtime without restart when possible */
  hotReload: boolean;
};

/** Only keys listed here are visible/editable. Arbitrary env access is denied. */
export const SETTING_DEFS: SettingDef[] = [
  {
    key: "HOLD_TTL_SECONDS",
    group: "Booking",
    label: "Thời gian giữ ghế (giây)",
    description: "TTL giữ ghế sau khi chọn. Mặc định 270 (~4,5 phút).",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    group: "App",
    label: "URL frontend",
    description: "Dùng cho OAuth redirect / liên kết trong email.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "UPLOAD_TMP_DIR",
    group: "App",
    label: "Thư mục tạm upload CCCD",
    description: "Ảnh CCCD chỉ lưu tạm rồi xóa.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "AI_SERVICE_URL",
    group: "AI / Age gate",
    label: "URL YOLO/OCR service",
    description: "Endpoint dịch vụ nhận diện CCCD.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "AI_SERVICE_KEY",
    group: "AI / Age gate",
    label: "API key AI service",
    description: "Khóa gọi AI service. Không bao giờ trả plaintext.",
    sensitivity: "secret",
    editable: true,
    hotReload: true,
  },
  {
    key: "OMDB_API_KEY",
    group: "Catalog",
    label: "OMDb API key",
    description: "Import/enrich phim qua OMDb.",
    sensitivity: "secret",
    editable: true,
    hotReload: true,
  },
  {
    key: "TMDB_API_KEY",
    group: "Catalog",
    label: "TMDB API key",
    description: "Đồng bộ now-playing / similar movies.",
    sensitivity: "secret",
    editable: true,
    hotReload: true,
  },
  {
    key: "PAYMENT_PROVIDER",
    group: "Thanh toán",
    label: "Nhà cung cấp thanh toán",
    description: "Hiện hỗ trợ SEPAY.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "SEPAY_ACCOUNT_NUMBER",
    group: "Thanh toán",
    label: "Số tài khoản SePay",
    description: "Số TK nhận chuyển khoản VietQR.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "SEPAY_BANK",
    group: "Thanh toán",
    label: "Mã ngân hàng SePay",
    description: "VD: MBBank.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "SEPAY_BANK_LABEL",
    group: "Thanh toán",
    label: "Nhãn ngân hàng",
    description: "Tên hiển thị trên checkout.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "SEPAY_ACCOUNT_NAME",
    group: "Thanh toán",
    label: "Tên chủ tài khoản",
    description: "Tên nhận tiền trên QR.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "SEPAY_QR_BASE",
    group: "Thanh toán",
    label: "SePay QR base URL",
    description: "Endpoint tạo ảnh VietQR.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "SEPAY_WEBHOOK_API_KEY",
    group: "Thanh toán",
    label: "SePay webhook API key",
    description: "Xác thực webhook. Không trả plaintext.",
    sensitivity: "secret",
    editable: true,
    hotReload: true,
  },
  {
    key: "SEPAY_WEBHOOK_SECRET",
    group: "Thanh toán",
    label: "SePay webhook secret",
    description: "Secret ký webhook. Không trả plaintext.",
    sensitivity: "secret",
    editable: true,
    hotReload: true,
  },
  {
    key: "SMTP_HOST",
    group: "Email",
    label: "SMTP host",
    description: "Máy chủ gửi mail thông báo.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "SMTP_PORT",
    group: "Email",
    label: "SMTP port",
    description: "Thường 587 hoặc 465.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "SMTP_USER",
    group: "Email",
    label: "SMTP user",
    description: "Tài khoản SMTP.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "SMTP_PASS",
    group: "Email",
    label: "SMTP password",
    description: "Mật khẩu SMTP. Không trả plaintext.",
    sensitivity: "secret",
    editable: true,
    hotReload: true,
  },
  {
    key: "MAIL_FROM",
    group: "Email",
    label: "Địa chỉ gửi",
    description: "VD: CINEWAVE <no-reply@cinewave.vn>",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "GOOGLE_CLIENT_ID",
    group: "OAuth Google",
    label: "Google Client ID",
    description: "OAuth client id.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "GOOGLE_CLIENT_SECRET",
    group: "OAuth Google",
    label: "Google Client Secret",
    description: "OAuth secret. Không trả plaintext.",
    sensitivity: "secret",
    editable: true,
    hotReload: true,
  },
  {
    key: "GOOGLE_CALLBACK_URL",
    group: "OAuth Google",
    label: "Google callback URL",
    description: "URL callback backend cho Google OAuth.",
    sensitivity: "public",
    editable: true,
    hotReload: true,
  },
  {
    key: "PORT",
    group: "Hạ tầng (chỉ xem)",
    label: "API port",
    description: "Cổng HTTP backend. Đổi qua deploy, không sửa tại runtime.",
    sensitivity: "locked",
    editable: false,
    hotReload: false,
  },
  {
    key: "MONGODB_URI",
    group: "Hạ tầng (chỉ xem)",
    label: "MongoDB URI",
    description: "Chuỗi kết nối DB — không lộ và không sửa qua Admin.",
    sensitivity: "locked",
    editable: false,
    hotReload: false,
  },
  {
    key: "JWT_SECRET",
    group: "Hạ tầng (chỉ xem)",
    label: "JWT access secret",
    description: "Khóa ký token. Chỉ cấu hình qua .env / secrets manager.",
    sensitivity: "locked",
    editable: false,
    hotReload: false,
  },
  {
    key: "JWT_REFRESH_SECRET",
    group: "Hạ tầng (chỉ xem)",
    label: "JWT refresh secret",
    description: "Khóa refresh token. Chỉ cấu hình qua .env / secrets manager.",
    sensitivity: "locked",
    editable: false,
    hotReload: false,
  },
  {
    key: "REDIS_URL",
    group: "Hạ tầng (chỉ xem)",
    label: "Redis URL",
    description: "Cache/queue (nếu dùng). Không sửa qua Admin.",
    sensitivity: "locked",
    editable: false,
    hotReload: false,
  },
];

const OVERRIDES_FILE = "system-settings.json";
const AUDIT_FILE = "system-settings-audit.json";

type Overrides = Record<string, string>;
type AuditEntry = {
  at: string;
  adminId: string;
  adminEmail: string;
  key: string;
  action: "update" | "clear";
};

let overridesCache: Overrides | null = null;
const bootSnapshot = new Map<string, string>();

const defByKey = new Map(SETTING_DEFS.map((item) => [item.key, item]));

for (const def of SETTING_DEFS) {
  bootSnapshot.set(def.key, process.env[def.key] ?? "");
}

export function getSettingDef(key: string) {
  return defByKey.get(key) ?? null;
}

export async function loadOverrides() {
  if (overridesCache) return overridesCache;
  overridesCache = await readJsonFile<Overrides>(OVERRIDES_FILE, {});
  return overridesCache;
}

export async function getRuntimeEnv(key: string, fallback = "") {
  const overrides = await loadOverrides();
  if (Object.prototype.hasOwnProperty.call(overrides, key) && overrides[key] !== undefined) {
    return String(overrides[key] ?? "");
  }
  return process.env[key] ?? fallback;
}

/** Sync read after ensureOverridesLoaded — use in hot paths after await loadOverrides(). */
export function getRuntimeEnvSync(key: string, fallback = "") {
  const overrides = overridesCache ?? {};
  if (Object.prototype.hasOwnProperty.call(overrides, key) && overrides[key] !== undefined) {
    return String(overrides[key] ?? "");
  }
  return process.env[key] ?? fallback;
}

export function maskSecret(value: string | undefined | null) {
  const raw = (value ?? "").trim();
  if (!raw) return { configured: false, hint: "" };
  if (raw.length <= 4) return { configured: true, hint: "••••" };
  return { configured: true, hint: `••••••••${raw.slice(-4)}` };
}

function resolveEffective(key: string, overrides: Overrides) {
  if (Object.prototype.hasOwnProperty.call(overrides, key)) return String(overrides[key] ?? "");
  return process.env[key] ?? "";
}

export async function listPublicSettings() {
  const overrides = await loadOverrides();
  return SETTING_DEFS.map((def) => {
    const effective = resolveEffective(def.key, overrides);
    const fromOverride = Object.prototype.hasOwnProperty.call(overrides, def.key);
    if (def.sensitivity === "secret" || def.sensitivity === "locked") {
      const masked = maskSecret(effective);
      return {
        key: def.key,
        group: def.group,
        label: def.label,
        description: def.description,
        sensitivity: def.sensitivity,
        editable: def.editable,
        hotReload: def.hotReload,
        configured: masked.configured,
        value: null as string | null,
        hint: masked.hint,
        source: fromOverride ? ("override" as const) : ("env" as const),
      };
    }
    return {
      key: def.key,
      group: def.group,
      label: def.label,
      description: def.description,
      sensitivity: def.sensitivity,
      editable: def.editable,
      hotReload: def.hotReload,
      configured: Boolean(effective.trim()),
      value: effective,
      hint: "",
      source: fromOverride ? ("override" as const) : ("env" as const),
    };
  });
}

export async function updateSettings(
  patch: Record<string, string | null>,
  meta: { adminId: string; adminEmail: string },
) {
  const overrides = { ...(await loadOverrides()) };
  const changed: string[] = [];
  const audit: AuditEntry[] = await readJsonFile<AuditEntry[]>(AUDIT_FILE, []);

  for (const [key, rawValue] of Object.entries(patch)) {
    const def = getSettingDef(key);
    if (!def) {
      throw new Error(`KEY_NOT_ALLOWED:${key}`);
    }
    if (!def.editable || def.sensitivity === "locked") {
      throw new Error(`KEY_LOCKED:${key}`);
    }

    if (rawValue === null) {
      if (Object.prototype.hasOwnProperty.call(overrides, key)) {
        delete overrides[key];
        process.env[key] = bootSnapshot.get(key) ?? "";
        changed.push(key);
        audit.push({
          at: new Date().toISOString(),
          adminId: meta.adminId,
          adminEmail: meta.adminEmail,
          key,
          action: "clear",
        });
      }
      continue;
    }

    const value = String(rawValue);
    if (def.sensitivity === "secret" && !value.trim()) {
      // empty secret = keep existing
      continue;
    }
    if (def.key === "HOLD_TTL_SECONDS") {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 60 || n > 3600) {
        throw new Error("INVALID_HOLD_TTL");
      }
    }
    overrides[key] = value;
    process.env[key] = value;
    changed.push(key);
    audit.push({
      at: new Date().toISOString(),
      adminId: meta.adminId,
      adminEmail: meta.adminEmail,
      key,
      action: "update",
    });
  }

  overridesCache = overrides;
  await writeJsonFile(OVERRIDES_FILE, overrides);
  await writeJsonFile(AUDIT_FILE, audit.slice(-200));
  return { changed };
}

export async function listSettingsAudit(limit = 40) {
  const audit = await readJsonFile<AuditEntry[]>(AUDIT_FILE, []);
  return audit.slice(-limit).reverse();
}

export async function getSystemStatus() {
  await loadOverrides();
  const mongo = Boolean((await getRuntimeEnv("MONGODB_URI")).trim());
  const jwt = Boolean((await getRuntimeEnv("JWT_SECRET")).trim());
  const ai = Boolean((await getRuntimeEnv("AI_SERVICE_URL")).trim());
  const sepay = Boolean((await getRuntimeEnv("SEPAY_ACCOUNT_NUMBER")).trim());
  const smtp = Boolean((await getRuntimeEnv("SMTP_HOST")).trim());
  const google =
    Boolean((await getRuntimeEnv("GOOGLE_CLIENT_ID")).trim()) &&
    Boolean((await getRuntimeEnv("GOOGLE_CLIENT_SECRET")).trim());
  const omdb = Boolean((await getRuntimeEnv("OMDB_API_KEY")).trim());
  const tmdb = Boolean((await getRuntimeEnv("TMDB_API_KEY")).trim());

  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    uptimeSec: Math.round(process.uptime()),
    checks: [
      { id: "mongodb", label: "MongoDB URI", ok: mongo },
      { id: "jwt", label: "JWT secrets", ok: jwt },
      { id: "ai", label: "AI / Age gate", ok: ai },
      { id: "sepay", label: "SePay", ok: sepay },
      { id: "smtp", label: "SMTP email", ok: smtp },
      { id: "google", label: "Google OAuth", ok: google },
      { id: "omdb", label: "OMDb", ok: omdb },
      { id: "tmdb", label: "TMDB", ok: tmdb },
    ],
  };
}
