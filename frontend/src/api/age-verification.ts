import { apiUrl, ApiError } from "./client";

export type AgeVerificationResult = {
  passed: boolean;
  requiredAge: number;
  computedAge: number | null;
  confidence: number;
  verificationId: string;
  idMasked: string | null;
  message: string;
  reasons?: string[];
  rawImageDeleted?: boolean;
};

function buildForm(input: {
  file: File;
  rating: string;
  movieSlug?: string;
  bookingId?: string;
  showtimeId?: string;
}) {
  const form = new FormData();
  form.append("file", input.file);
  form.append("rating", input.rating);
  if (input.movieSlug) form.append("movieSlug", input.movieSlug);
  if (input.bookingId) form.append("bookingId", input.bookingId);
  if (input.showtimeId) form.append("showtimeId", input.showtimeId);
  return form;
}

async function postAgeVerification(form: FormData) {
  return fetch(apiUrl("/age-verification"), {
    method: "POST",
    credentials: "include",
    body: form,
  });
}

export async function submitAgeVerification(input: {
  file: File;
  rating: string;
  movieSlug?: string;
  bookingId?: string;
  showtimeId?: string;
}): Promise<AgeVerificationResult> {
  let res = await postAgeVerification(buildForm(input));

  if (res.status === 401) {
    const refreshed = await fetch(apiUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      res = await postAgeVerification(buildForm(input));
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.code ?? "ERROR", data.message ?? "Có lỗi xảy ra", res.status);
  }
  return data as AgeVerificationResult;
}
