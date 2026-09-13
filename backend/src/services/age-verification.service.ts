import { DomainError } from "../models/errors.js";
import { notifyUser } from "./notification.service.js";

type VerifyBody = {
  passed?: boolean;
  rating?: string;
  movieSlug?: string;
};

export async function verifyAge(userId: string, body: VerifyBody) {
  if (typeof body.passed !== "boolean") {
    throw new DomainError("VALIDATION_ERROR", "Kết quả xác minh không hợp lệ");
  }
  const movieLabel = body.movieSlug ?? "suất này";
  const rating = body.rating ? ` (${body.rating})` : "";
  await notifyUser({
    userId,
    type: body.passed ? "AGE_VERIFIED" : "AGE_FAILED",
    title: body.passed ? "Xác minh tuổi thành công" : "Xác minh tuổi chưa đạt",
    body: body.passed
      ? `Bạn đủ điều kiện xem ${movieLabel}${rating}. Ảnh CCCD không được lưu lâu dài.`
      : `Chưa xác minh được tuổi cho ${movieLabel}${rating}. Thử ảnh rõ hơn hoặc giấy tờ khác.`,
    href: body.movieSlug ? `/movies/${body.movieSlug}` : "/movies",
    movieSlug: body.movieSlug ?? null,
    dedupe: false,
  });
  return { passed: body.passed };
}
