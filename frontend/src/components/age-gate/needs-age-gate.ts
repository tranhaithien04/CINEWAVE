import type { AgeRating } from "@/@types/movie";

export const requiredAgeByRating: Record<AgeRating, number | null> = {
  P: null,
  K: null,
  T13: 13,
  T16: 16,
  T18: 18,
};

export function needsAgeGate(rating: AgeRating) {
  return requiredAgeByRating[rating] !== null;
}
