import { DomainError } from "../models/errors.js";
import { fetchJson } from "../helpers/http.js";

const OMDB_URL = "https://www.omdbapi.com/";

export type OmdbSearchHit = {
  imdbId: string;
  title: string;
  year: string;
  posterUrl: string | null;
};

export type OmdbTitle = {
  imdbId: string;
  title: string;
  year: string;
  plot: string;
  runtimeMin: number | null;
  genres: string[];
  director: string | null;
  actors: string | null;
  posterUrl: string | null;
  imdbRating: number | null;
  imdbVotes: number | null;
};

function apiKey() {
  const key = process.env.OMDB_API_KEY?.trim();
  if (!key) {
    throw new DomainError("VALIDATION_ERROR", "Chưa cấu hình OMDB_API_KEY trong backend/.env", 503);
  }
  return key;
}

function posterOrNull(value: unknown) {
  if (typeof value !== "string" || !value || value === "N/A") return null;
  return value;
}

function parseRuntime(value: unknown) {
  if (typeof value !== "string") return null;
  const match = value.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function parseRating(value: unknown) {
  if (typeof value !== "string" || value === "N/A") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseVotes(value: unknown) {
  if (typeof value !== "string" || value === "N/A") return null;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function searchOmdbMovies(query: string): Promise<OmdbSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) {
    throw new DomainError("VALIDATION_ERROR", "Nhập ít nhất 2 ký tự để tìm phim IMDb");
  }

  const url = new URL(OMDB_URL);
  url.searchParams.set("apikey", apiKey());
  url.searchParams.set("s", q);
  url.searchParams.set("type", "movie");

  const data = await fetchJson<{
    Response?: string;
    Error?: string;
    Search?: Array<{ imdbID: string; Title: string; Year: string; Poster: string }>;
  }>(url);

  if (data.Response === "False" || !data.Search?.length) {
    return [];
  }

  return data.Search.map((item) => ({
    imdbId: item.imdbID,
    title: item.Title,
    year: item.Year,
    posterUrl: posterOrNull(item.Poster),
  }));
}

export async function fetchOmdbById(imdbId: string): Promise<OmdbTitle> {
  const url = new URL(OMDB_URL);
  url.searchParams.set("apikey", apiKey());
  url.searchParams.set("i", imdbId);
  url.searchParams.set("plot", "full");

  const data = await fetchJson<Record<string, string>>(url);

  if (data.Response === "False" || !data.imdbID) {
    throw new DomainError("NOT_FOUND", data.Error || "Không tìm thấy phim trên OMDb", 404);
  }

  const genres = (data.Genre ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    imdbId: data.imdbID,
    title: data.Title,
    year: data.Year,
    plot: data.Plot && data.Plot !== "N/A" ? data.Plot : data.Title,
    runtimeMin: parseRuntime(data.Runtime),
    genres,
    director: data.Director && data.Director !== "N/A" ? data.Director : null,
    actors: data.Actors && data.Actors !== "N/A" ? data.Actors : null,
    posterUrl: posterOrNull(data.Poster),
    imdbRating: parseRating(data.imdbRating),
    imdbVotes: parseVotes(data.imdbVotes),
  };
}
