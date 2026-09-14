import bcrypt from "bcryptjs";

import { DomainError } from "../models/errors.js";
import { findUserById } from "../helpers/user-store.js";
import {
  getSystemStatus,
  listPublicSettings,
  listSettingsAudit,
  loadOverrides,
  updateSettings,
} from "../helpers/system-settings.js";

export async function getAdminSystemSettings() {
  await loadOverrides();
  return {
    settings: await listPublicSettings(),
    status: await getSystemStatus(),
    audit: await listSettingsAudit(30),
    security: {
      note: "Giá trị secret/locked không bao giờ trả plaintext. JWT & MongoDB chỉ cấu hình qua secrets/.env. Mọi thay đổi ghi audit (không lưu secret mới).",
      requirePasswordForSecrets: true,
    },
  };
}

export async function patchAdminSystemSettings(
  adminId: string,
  body: unknown,
) {
  if (!body || typeof body !== "object") {
    throw new DomainError("VALIDATION_ERROR", "Payload không hợp lệ");
  }
  const input = body as {
    settings?: Record<string, string | null>;
    confirmPassword?: string;
  };
  const settings = input.settings;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    throw new DomainError("VALIDATION_ERROR", "Thiếu object settings");
  }

  const keys = Object.keys(settings);
  if (!keys.length) {
    throw new DomainError("VALIDATION_ERROR", "Không có thay đổi");
  }
  if (keys.length > 40) {
    throw new DomainError("VALIDATION_ERROR", "Quá nhiều khóa trong một lần cập nhật");
  }

  const touchesSecret = keys.some((key) => {
    const current = settings[key];
    return current !== null && String(current).length > 0;
  });

  // Always require password when changing anything sensitive-looking or any update
  const password = typeof input.confirmPassword === "string" ? input.confirmPassword : "";
  if (!password) {
    throw new DomainError("FORBIDDEN", "Nhập mật khẩu Admin để xác nhận thay đổi cấu hình", 403);
  }

  const admin = await findUserById(adminId);
  if (!admin || admin.role !== "ADMIN") {
    throw new DomainError("FORBIDDEN", "Không có quyền", 403);
  }
  if (!admin.password) {
    throw new DomainError(
      "FORBIDDEN",
      "Tài khoản Admin OAuth cần đặt mật khẩu local trước khi sửa cấu hình hệ thống",
      403,
    );
  }
  if (!(await bcrypt.compare(password, admin.password))) {
    throw new DomainError("FORBIDDEN", "Mật khẩu xác nhận không đúng", 403);
  }

  void touchesSecret;

  try {
    const result = await updateSettings(settings, {
      adminId: admin.id,
      adminEmail: admin.email,
    });
    return {
      ...result,
      settings: await listPublicSettings(),
      status: await getSystemStatus(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "VALIDATION_ERROR";
    if (message.startsWith("KEY_NOT_ALLOWED:")) {
      throw new DomainError("FORBIDDEN", "Khóa cấu hình không được phép", 403);
    }
    if (message.startsWith("KEY_LOCKED:")) {
      throw new DomainError("FORBIDDEN", "Khóa hạ tầng bị khóa, chỉ sửa qua .env/secrets", 403);
    }
    if (message === "INVALID_HOLD_TTL") {
      throw new DomainError("VALIDATION_ERROR", "HOLD_TTL_SECONDS phải từ 60 đến 3600");
    }
    throw new DomainError("VALIDATION_ERROR", "Không cập nhật được cấu hình");
  }
}

export async function getAdminSystemStatus() {
  await loadOverrides();
  return getSystemStatus();
}
