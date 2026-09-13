import { DomainError } from "../models/errors.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseRegisterInput(body: unknown) {
  const data = (body ?? {}) as Record<string, unknown>;
  const email = String(data.email ?? "").trim().toLowerCase();
  const password = String(data.password ?? "");
  const fullName = String(data.fullName ?? "").trim();

  if (!EMAIL_RE.test(email)) {
    throw new DomainError("VALIDATION_ERROR", "Email không hợp lệ");
  }
  if (password.length < 8) {
    throw new DomainError("VALIDATION_ERROR", "Mật khẩu tối thiểu 8 ký tự");
  }
  if (!fullName) {
    throw new DomainError("VALIDATION_ERROR", "Vui lòng nhập họ tên");
  }

  return { email, password, fullName };
}

export function parseLoginInput(body: unknown) {
  const data = (body ?? {}) as Record<string, unknown>;
  const email = String(data.email ?? "").trim().toLowerCase();
  const password = String(data.password ?? "");

  if (!EMAIL_RE.test(email) || !password) {
    throw new DomainError("VALIDATION_ERROR", "Email hoặc mật khẩu không hợp lệ");
  }

  return { email, password };
}
