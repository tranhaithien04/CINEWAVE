import { createHash } from "node:crypto";
import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { createAgeVerification, saveAgeVerification } from "../helpers/age-verification-store.js";
import { DomainError } from "../models/errors.js";
import { notifyUser } from "./notification.service.js";

const REQUIRED_AGE: Record<string, number | null> = {
  P: null,
  K: null,
  T13: 13,
  T16: 16,
  T18: 18,
};

const MIN_AI_CONFIDENCE = 0.25;
const CCCD_TMP_TTL_MS = 15 * 60 * 1000;

export type CccdQrFields = {
  decoded: boolean;
  idNumber?: string | null;
  oldId?: string | null;
  fullName?: string | null;
  dob?: string | null;
  gender?: string | null;
  address?: string | null;
  issueDate?: string | null;
};

type AiAnalyzeResponse = {
  success?: boolean;
  idMasked?: string | null;
  idHash?: string | null;
  fullName?: string | null;
  dob?: string | null;
  dobSource?: string;
  qrMatched?: boolean;
  ocrOnly?: boolean;
  fieldsOk?: boolean;
  confidence?: number;
  fieldConfidence?: Record<string, number>;
  reasons?: string[];
  qrDecoded?: boolean;
  qr?: CccdQrFields;
};

export type VerifyUploadInput = {
  rating?: string;
  movieSlug?: string;
  bookingId?: string;
  showtimeId?: string;
  file: Express.Multer.File;
};

function uploadTmpDir() {
  return path.resolve(process.cwd(), process.env.UPLOAD_TMP_DIR ?? "./uploads/tmp");
}

function parseDob(dob: string): Date | null {
  const match = dob.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

export function computeAge(dob: string, asOf = new Date()): number | null {
  const birth = parseDob(dob);
  if (!birth) return null;
  let age = asOf.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = asOf.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age >= 0 && age < 150 ? age : null;
}

async function callAiAnalyze(file: Express.Multer.File): Promise<AiAnalyzeResponse> {
  const base = (process.env.AI_SERVICE_URL ?? "http://localhost:8000").replace(/\/$/, "");
  const form = new FormData();
  const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype || "image/jpeg" });
  form.append("file", blob, file.originalname || "cccd.jpg");

  const headers: Record<string, string> = {};
  const key = process.env.AI_SERVICE_KEY;
  if (key && key !== "change-me") {
    headers["x-api-key"] = key;
  }

  let res: Response;
  try {
    res = await fetch(`${base}/analyze`, {
      method: "POST",
      body: form,
      headers,
    });
  } catch {
    throw new DomainError("VALIDATION_ERROR", "Không kết nối được dịch vụ nhận diện CCCD", 503);
  }

  const data = (await res.json().catch(() => ({}))) as AiAnalyzeResponse & {
    detail?: string;
    message?: string;
  };
  if (!res.ok) {
    throw new DomainError(
      "VALIDATION_ERROR",
      data.detail ?? data.message ?? "Nhận diện CCCD thất bại",
      res.status >= 400 && res.status < 600 ? res.status : 502,
    );
  }
  return data;
}

async function persistTempUpload(file: Express.Multer.File) {
  // Fire-and-forget style: write after AI call to avoid blocking critical path.
  // Kept for audit TTL purge; not on the hot path anymore.
  const dir = uploadTmpDir();
  await mkdir(dir, { recursive: true });
  const safeName = `${Date.now()}-${createHash("sha1").update(file.originalname || "cccd").digest("hex").slice(0, 8)}.jpg`;
  const fullPath = path.join(dir, safeName);
  await writeFile(fullPath, file.buffer);
  return fullPath;
}

export async function purgeCccdTmp() {
  const dir = uploadTmpDir();
  let entries: string[] = [];
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }
  const now = Date.now();
  await Promise.all(
    entries.map(async (name) => {
      const full = path.join(dir, name);
      try {
        const info = await stat(full);
        if (now - info.mtimeMs > CCCD_TMP_TTL_MS) {
          await unlink(full);
        }
      } catch {
        // ignore individual file errors
      }
    }),
  );
}

export async function verifyAgeFromUpload(userId: string, input: VerifyUploadInput) {
  const rating = (input.rating ?? "").toUpperCase();
  const requiredAge = REQUIRED_AGE[rating];
  if (requiredAge == null) {
    throw new DomainError("VALIDATION_ERROR", "Phim này không yêu cầu xác minh tuổi");
  }
  if (!input.file?.buffer?.length) {
    throw new DomainError("VALIDATION_ERROR", "Vui lòng tải ảnh mặt trước CCCD");
  }

  const mime = input.file.mimetype || "";
  if (!mime.startsWith("image/")) {
    throw new DomainError("VALIDATION_ERROR", "File phải là ảnh JPEG/PNG/WEBP");
  }
  if (input.file.size > 5 * 1024 * 1024) {
    throw new DomainError("VALIDATION_ERROR", "Ảnh tối đa 5MB");
  }

  const tmpPathPromise = persistTempUpload(input.file).catch(() => null as string | null);
  let rawImageDeleted = false;

  try {
    const ai = await callAiAnalyze(input.file);
    const tmpPath = await tmpPathPromise;
    const dob = ai.dob ?? null;
    const computedAge = dob ? computeAge(dob) : null;
    const confidence = typeof ai.confidence === "number" ? ai.confidence : 0;
    const reasons = Array.isArray(ai.reasons) ? ai.reasons : [];
    const hasMismatch = reasons.some((r) => r.endsWith("_mismatch"));
    const fieldsOk =
      ai.fieldsOk === true ||
      ai.qrMatched === true ||
      (ai.ocrOnly === true && Boolean(dob) && Boolean(ai.idMasked));

    let failureReason: string | null = null;
    let passed = false;

    if (hasMismatch) {
      failureReason = reasons.filter((r) => r.endsWith("_mismatch")).join(",") || "field_mismatch";
    } else if (!fieldsOk || !dob || computedAge == null) {
      if (reasons.includes("missing_dob") || !dob) failureReason = "missing_dob";
      else if (reasons.includes("missing_id") || !ai.idMasked) failureReason = "missing_id";
      else failureReason = reasons.join(",") || "fields_incomplete";
    } else if (confidence < MIN_AI_CONFIDENCE) {
      failureReason = "low_confidence";
    } else if (computedAge < requiredAge) {
      failureReason = "underage";
    } else {
      passed = true;
    }

    const failHint =
      failureReason === "underage"
        ? `Yêu cầu ${requiredAge}+ tuổi.`
        : failureReason === "missing_dob"
          ? "Không đọc được ngày sinh trên CCCD."
          : failureReason === "missing_id"
            ? "Không đọc được số CCCD."
            : hasMismatch
              ? "Thông tin OCR không khớp mã QR."
              : "Thử ảnh rõ hơn, đủ sáng, hiện đủ chữ và mã QR.";

    const record = await createAgeVerification({
      userId,
      bookingId: input.bookingId ?? null,
      showtimeId: input.showtimeId ?? null,
      movieSlug: input.movieSlug ?? null,
      rating: rating || null,
      requiredAge,
      computedAge,
      passed,
      confidence,
      idNumberHash: ai.idHash ?? null,
      idMasked: ai.idMasked ?? null,
      rawImageDeleted: false,
      failureReason,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    if (tmpPath) {
      try {
        await unlink(tmpPath);
        rawImageDeleted = true;
        record.rawImageDeleted = true;
        await saveAgeVerification(record);
      } catch {
        // purge job will clean later
      }
    } else {
      rawImageDeleted = true;
      record.rawImageDeleted = true;
      await saveAgeVerification(record);
    }

    const movieLabel = input.movieSlug ?? "suất này";
    await notifyUser({
      userId,
      type: passed ? "AGE_VERIFIED" : "AGE_FAILED",
      title: passed ? "Xác minh tuổi thành công" : "Xác minh tuổi chưa đạt",
      body: passed
        ? `Bạn đủ điều kiện xem ${movieLabel} (${rating}). Ảnh CCCD không được lưu lâu dài.`
        : `Chưa xác minh được tuổi cho ${movieLabel} (${rating}). ${failHint}`,
      href: input.movieSlug ? `/movies/${input.movieSlug}` : "/movies",
      movieSlug: input.movieSlug ?? null,
      bookingId: input.bookingId ?? null,
      dedupe: false,
    });

    const qr = ai.qr ?? {
      decoded: ai.qrDecoded === true,
      fullName: ai.fullName ?? null,
      dob: ai.dob ?? null,
    };

    return {
      passed,
      requiredAge,
      computedAge,
      confidence,
      verificationId: record.id,
      idMasked: ai.idMasked ?? null,
      fullName: qr.fullName ?? ai.fullName ?? null,
      dob: qr.dob ?? ai.dob ?? null,
      qr,
      qrDecoded: qr.decoded,
      qrMatched: ai.qrMatched === true,
      message: passed
        ? `Đủ điều kiện xem phim ${rating}`
        : failureReason === "underage"
          ? `Chưa đủ ${requiredAge} tuổi`
          : failHint,
      reasons,
      rawImageDeleted,
    };
  } catch (error) {
    const tmpPath = await tmpPathPromise.catch(() => null);
    if (tmpPath) {
      try {
        await unlink(tmpPath);
      } catch {
        // ignore
      }
    }
    throw error;
  }
}

/** Legacy JSON body path — rejected so clients must upload image. */
export async function verifyAge(_userId: string, _body: { passed?: boolean }) {
  throw new DomainError(
    "VALIDATION_ERROR",
    "Vui lòng tải ảnh CCCD (multipart) để xác minh tuổi",
    400,
  );
}
