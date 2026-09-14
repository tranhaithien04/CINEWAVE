import { DomainError } from "../models/errors.js";
import { fetchJson } from "../helpers/http.js";

const TMDB_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

export type TmdbMovieRef = {
  id: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
};

export type TmdbSimilarItem = {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  year: string | null;
};

function apiKey() {
  const key = process.env.TMDB_API_KEY?.trim();
  if (!key) {
    throw new DomainError("VALIDATION_ERROR", "Chưa cấu hình TMDB_API_KEY trong backend/.env", 503);
  }
  return key;
}

function tmdbUrl(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_URL}${path}`);
  url.searchParams.set("api_key", apiKey());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

export function tmdbImage(path: string | null | undefined, size: "w500" | "w1280" | "original" = "w1280") {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  return fetchJson<T>(tmdbUrl(path, params));
}

export async function findTmdbByImdbId(imdbId: string): Promise<TmdbMovieRef | null> {
  const data = await tmdbGet<{
    movie_results?: Array<{
      id: number;
      title?: string;
      name?: string;
      poster_path: string | null;
      backdrop_path: string | null;
      release_date?: string;
    }>;
  }>(`/find/${encodeURIComponent(imdbId)}`, { external_source: "imdb_id" });

  const movie = data.movie_results?.[0];
  if (!movie) return null;

  return {
    id: movie.id,
    title: movie.title || movie.name || "",
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    releaseDate: movie.release_date ?? null,
  };
}

export async function fetchYoutubeTrailer(tmdbId: number): Promise<string | undefined> {
  const data = await tmdbGet<{
    results?: Array<{ key: string; site: string; type: string; official?: boolean }>;
  }>(`/movie/${tmdbId}/videos`);

  const videos = data.results ?? [];
  const trailer =
    videos.find((item) => item.site === "YouTube" && item.type === "Trailer" && item.official) ??
    videos.find((item) => item.site === "YouTube" && item.type === "Trailer") ??
    videos.find((item) => item.site === "YouTube");

  return trailer ? `https://www.youtube.com/embed/${trailer.key}` : undefined;
}

export async function fetchTmdbSimilar(tmdbId: number): Promise<TmdbSimilarItem[]> {
  const data = await tmdbGet<{
    results?: Array<{
      id: number;
      title?: string;
      name?: string;
      poster_path: string | null;
      release_date?: string;
    }>;
  }>(`/movie/${tmdbId}/similar`);

  return (data.results ?? []).slice(0, 12).map((item) => ({
    tmdbId: item.id,
    title: item.title || item.name || "Untitled",
    posterUrl: tmdbImage(item.poster_path, "w500"),
    year: item.release_date ? item.release_date.slice(0, 4) : null,
  }));
}

export async function fetchTmdbNowPlaying(region = "VN"): Promise<TmdbMovieRef[]> {
  const data = await tmdbGet<{
    results?: Array<{
      id: number;
      title?: string;
      name?: string;
      poster_path: string | null;
      backdrop_path: string | null;
      release_date?: string;
    }>;
  }>("/movie/now_playing", { region, language: "en-US" });

  let results = data.results ?? [];
  if (!results.length && region !== "US") {
    return fetchTmdbNowPlaying("US");
  }

  return results.map((movie) => ({
    id: movie.id,
    title: movie.title || movie.name || "",
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    releaseDate: movie.release_date ?? null,
  }));
}

export async function fetchTmdbImdbId(tmdbId: number): Promise<string | null> {
  const data = await tmdbGet<{ imdb_id?: string | null }>(`/movie/${tmdbId}/external_ids`);
  const id = data.imdb_id?.trim();
  return id && /^tt\d{5,}$/.test(id) ? id : null;
}

export async function fetchTmdbMovieDetails(tmdbId: number) {
  const details = await tmdbGet<{
    id: number;
    title?: string;
    overview?: string;
    runtime?: number | null;
    release_date?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    vote_average?: number;
    vote_count?: number;
    genres?: Array<{ name: string }>;
    imdb_id?: string | null;
  }>(`/movie/${tmdbId}`);
  const credits = await tmdbGet<{
    crew?: Array<{ job: string; name: string }>;
    cast?: Array<{ name: string }>;
  }>(`/movie/${tmdbId}/credits`);

  const director = (details && credits.crew ? credits.crew : [])
    .filter((person) => person.job === "Director")
    .map((person) => person.name)
    .slice(0, 3)
    .join(", ");
  const actors = (credits.cast ?? [])
    .slice(0, 6)
    .map((person) => person.name)
    .join(", ");

  return {
    tmdbId: details.id,
    imdbId: details.imdb_id && /^tt\d{5,}$/.test(details.imdb_id) ? details.imdb_id : null,
    title: details.title || "",
    plot: details.overview || details.title || "",
    runtimeMin: details.runtime ?? null,
    year: details.release_date ? details.release_date.slice(0, 4) : "",
    posterPath: details.poster_path,
    backdropPath: details.backdrop_path,
    genres: (details.genres ?? []).map((item) => item.name).filter(Boolean),
    director: director || null,
    actors: actors || null,
    tmdbRating: typeof details.vote_average === "number" ? details.vote_average : null,
    tmdbVotes: typeof details.vote_count === "number" ? details.vote_count : null,
  };
}
