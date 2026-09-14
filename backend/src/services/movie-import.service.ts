import { randomUUID } from "node:crypto";

import {
  ensureSampleShowtimes,
  ensureSampleShowtimesForNowShowing,
  getMovieById,
  getMovieByImdbId,
  getMovieBySlug,
  getMovieByTmdbId,
  saveMovie,
} from "../helpers/catalog-store.js";
import { AGE_RATINGS, type AgeRating, type MovieRecord } from "../models/catalog.js";
import { DomainError } from "../models/errors.js";
import { slugify } from "../validators/admin.js";
import { fetchOmdbById, searchOmdbMovies } from "./omdb.service.js";
import {
  fetchTmdbImdbId,
  fetchTmdbMovieDetails,
  fetchTmdbNowPlaying,
  fetchTmdbSimilar,
  fetchYoutubeTrailer,
  findTmdbByImdbId,
  tmdbImage,
} from "./tmdb.service.js";

const FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&h=900";

const SIMILAR_TTL_MS = 6 * 60 * 60 * 1000;
const similarCache = new Map<string, { at: number; items: SimilarMovie[] }>();

export type SimilarMovie = {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  year: string | null;
  slug?: string;
  imdbRating?: number;
};

function parseAgeRating(value: unknown): AgeRating {
  const rating = String(value ?? "");
  if (!AGE_RATINGS.includes(rating as AgeRating)) {
    throw new DomainError("VALIDATION_ERROR", "Nhãn tuổi không hợp lệ");
  }
  return rating as AgeRating;
}

function parseImdbId(value: unknown) {
  const id = String(value ?? "").trim();
  if (!/^tt\d{5,}$/.test(id)) {
    throw new DomainError("VALIDATION_ERROR", "imdbId không hợp lệ");
  }
  return id;
}

async function uniqueSlug(title: string, imdbId: string) {
  const base = slugify(title) || imdbId.toLowerCase();
  if (!(await getMovieBySlug(base))) return base;
  return `${base}-${imdbId.replace("tt", "")}`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function buildFromTmdbId(tmdbId: number, imdbId?: string) {
  const details = await fetchTmdbMovieDetails(tmdbId);
  const trailer = await fetchYoutubeTrailer(tmdbId);
  const posterUrl = tmdbImage(details.posterPath, "w500") || FALLBACK_POSTER;
  const backdropUrl = tmdbImage(details.backdropPath, "original") || posterUrl;
  return {
    title: details.title,
    description: details.plot,
    durationMin: details.runtimeMin ?? 120,
    posterUrl,
    backdropUrl,
    genres: details.genres.length ? details.genres : ["Khác"],
    ...(trailer ? { trailerUrl: trailer } : {}),
    ...(imdbId || details.imdbId ? { imdbId: imdbId || details.imdbId! } : {}),
    tmdbId,
    ...(details.tmdbRating != null ? { imdbRating: Number(details.tmdbRating.toFixed(1)) } : {}),
    ...(details.tmdbVotes != null ? { imdbVotes: details.tmdbVotes } : {}),
    year: details.year,
    ...(details.director ? { director: details.director } : {}),
    ...(details.actors ? { actors: details.actors } : {}),
  };
}

async function buildFromImdb(imdbId: string) {
  let omdb = null;
  try {
    omdb = await fetchOmdbById(imdbId);
  } catch {
    omdb = null;
  }

  let tmdb = null;
  let trailer: string | undefined;
  try {
    tmdb = await findTmdbByImdbId(imdbId);
    if (tmdb) trailer = await fetchYoutubeTrailer(tmdb.id);
  } catch (error) {
    if (error instanceof DomainError && error.status === 503) throw error;
  }

  if (!omdb && tmdb) {
    return buildFromTmdbId(tmdb.id, imdbId);
  }
  if (!omdb && !tmdb) {
    throw new DomainError("NOT_FOUND", "Không lấy được metadata phim từ OMDb/TMDB", 404);
  }

  const posterUrl = omdb!.posterUrl || tmdbImage(tmdb?.posterPath, "w500") || FALLBACK_POSTER;
  const backdropUrl = tmdbImage(tmdb?.backdropPath, "original") || posterUrl;

  return {
    title: omdb!.title,
    description: omdb!.plot,
    durationMin: omdb!.runtimeMin ?? 120,
    posterUrl,
    backdropUrl,
    genres: omdb!.genres.length ? omdb!.genres : ["Khác"],
    ...(trailer ? { trailerUrl: trailer } : {}),
    imdbId: omdb!.imdbId,
    ...(tmdb?.id ? { tmdbId: tmdb.id } : {}),
    ...(omdb!.imdbRating != null ? { imdbRating: omdb!.imdbRating } : {}),
    ...(omdb!.imdbVotes != null ? { imdbVotes: omdb!.imdbVotes } : {}),
    year: omdb!.year,
    ...(omdb!.director ? { director: omdb!.director } : {}),
    ...(omdb!.actors ? { actors: omdb!.actors } : {}),
  };
}

async function persistImportedMovie(
  meta: Awaited<ReturnType<typeof buildFromImdb>>,
  rating: AgeRating,
  nowShowing: boolean,
  seedId: string,
) {
  if ("tmdbId" in meta && typeof meta.tmdbId === "number") {
    const clash = await getMovieByTmdbId(meta.tmdbId);
    if (clash) return clash;
  }
  const movie: MovieRecord = {
    id: randomUUID(),
    slug: await uniqueSlug(meta.title, seedId),
    rating,
    nowShowing,
    ...meta,
  };
  try {
    return await saveMovie(movie);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("duplicate key")) {
      if ("tmdbId" in meta && typeof meta.tmdbId === "number") {
        const existing = await getMovieByTmdbId(meta.tmdbId);
        if (existing) return existing;
      }
      if (meta.imdbId) {
        const existing = await getMovieByImdbId(meta.imdbId);
        if (existing) return existing;
      }
    }
    throw error;
  }
}

async function withSampleShowtimes(movie: MovieRecord) {
  await ensureSampleShowtimes(movie.slug);
  return movie;
}

export async function searchCatalog(query: string) {
  return searchOmdbMovies(query);
}

export async function importFromImdb(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new DomainError("VALIDATION_ERROR", "Dữ liệu import không hợp lệ");
  }
  const input = body as Record<string, unknown>;
  const imdbId = parseImdbId(input.imdbId);
  const rating = parseAgeRating(input.rating);
  const nowShowing = typeof input.nowShowing === "boolean" ? input.nowShowing : true;

  const existing = await getMovieByImdbId(imdbId);
  if (existing) {
    throw new DomainError("VALIDATION_ERROR", "Phim IMDb này đã có trong catalog", 409);
  }

  const meta = await buildFromImdb(imdbId);
  return withSampleShowtimes(await persistImportedMovie(meta, rating, nowShowing, imdbId));
}

export async function syncNowPlaying(body: unknown) {
  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const rating = input.rating ? parseAgeRating(input.rating) : ("T13" as AgeRating);
  const limitRaw = typeof input.limit === "number" ? input.limit : Number(input.limit ?? 12);
  const limit = Number.isFinite(limitRaw) ? Math.min(20, Math.max(1, Math.round(limitRaw))) : 12;
  const region = typeof input.region === "string" && input.region.trim() ? input.region.trim().toUpperCase() : "VN";

  let playing: Awaited<ReturnType<typeof fetchTmdbNowPlaying>> = [];
  try {
    playing = (await fetchTmdbNowPlaying(region)).slice(0, limit);
  } catch {
    return syncPopularImdbTitles(rating, limit, region);
  }
  if (!playing.length) {
    return syncPopularImdbTitles(rating, limit, region);
  }
  const imported: MovieRecord[] = [];
  const skipped: string[] = [];
  const failed: Array<{ title: string; reason: string }> = [];

  for (const item of playing) {
    try {
      const localTmdb = await getMovieByTmdbId(item.id);
      if (localTmdb) {
        skipped.push(item.title);
        await ensureSampleShowtimes(localTmdb.slug);
        continue;
      }

      const imdbId = (await fetchTmdbImdbId(item.id)) ?? (await fetchTmdbMovieDetails(item.id)).imdbId;
      if (imdbId) {
        const localImdb = await getMovieByImdbId(imdbId);
        if (localImdb) {
          skipped.push(item.title);
          await ensureSampleShowtimes(localImdb.slug);
          continue;
        }
        const meta = await buildFromImdb(imdbId);
        imported.push(await withSampleShowtimes(await persistImportedMovie(meta, rating, true, imdbId)));
      } else {
        const meta = await buildFromTmdbId(item.id);
        imported.push(await withSampleShowtimes(await persistImportedMovie(meta, rating, true, `tmdb${item.id}`)));
      }
      await wait(250);
    } catch (error) {
      failed.push({
        title: item.title,
        reason: error instanceof Error ? error.message : "Không import được",
      });
    }
  }

  if (!imported.length && failed.length === playing.length) {
    return syncPopularImdbTitles(rating, limit, region);
  }

  const sample = await ensureSampleShowtimesForNowShowing();
  return {
    region,
    scanned: playing.length,
    imported,
    skipped: skipped.length,
    skippedTitles: skipped,
    failed,
    showtimesFilled: sample.moviesFilled,
  };
}

const POPULAR_IMDB_IDS = [
  "tt15398776",
  "tt1517268",
  "tt9603212",
  "tt1630029",
  "tt6791350",
  "tt9362722",
  "tt10676048",
  "tt13622970",
  "tt1745960",
  "tt14230458",
  "tt1160419",
  "tt13238346",
];

async function syncPopularImdbTitles(rating: AgeRating, limit: number, region: string) {
  const imported: MovieRecord[] = [];
  const skipped: string[] = [];
  const failed: Array<{ title: string; reason: string }> = [];
  const ids = POPULAR_IMDB_IDS.slice(0, limit);

  for (const imdbId of ids) {
    try {
      const existing = await getMovieByImdbId(imdbId);
      if (existing) {
        skipped.push(existing.title);
        await ensureSampleShowtimes(existing.slug);
        continue;
      }
      const meta = await buildFromImdb(imdbId);
      imported.push(await withSampleShowtimes(await persistImportedMovie(meta, rating, true, imdbId)));
      await wait(300);
    } catch (error) {
      failed.push({
        title: imdbId,
        reason: error instanceof Error ? error.message : "Không import được",
      });
    }
  }

  if (!imported.length && !skipped.length) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Không kết nối được TMDB. OMDb cũng lỗi — kiểm tra mạng/VPN hoặc đổi API key trong backend/.env.",
      502,
    );
  }

  const sample = await ensureSampleShowtimesForNowShowing();
  return {
    region: `${region}+imdb`,
    scanned: ids.length,
    imported,
    skipped: skipped.length,
    skippedTitles: skipped,
    failed,
    showtimesFilled: sample.moviesFilled,
  };
}

export async function enrichExistingMovie(id: string) {
  const current = await getMovieById(id);
  if (!current) throw new DomainError("NOT_FOUND", "Không tìm thấy phim", 404);

  if (current.imdbId) {
    const meta = await buildFromImdb(current.imdbId);
    const saved = await saveMovie({ ...current, ...meta, id: current.id, slug: current.slug, rating: current.rating, nowShowing: current.nowShowing });
    await ensureSampleShowtimes(saved.slug);
    return saved;
  }

  const hits = await searchOmdbMovies(current.title);
  if (hits.length !== 1) {
    throw new DomainError(
      "VALIDATION_ERROR",
      hits.length === 0
        ? "OMDb không tìm thấy phim trùng tên. Import thủ công bằng imdbId."
        : `OMDb tìm thấy ${hits.length} kết quả. Chỉ enrich khi khớp đúng 1 phim.`,
    );
  }

  const hit = hits[0]!;
  const taken = await getMovieByImdbId(hit.imdbId);
  if (taken && taken.id !== current.id) {
    throw new DomainError("VALIDATION_ERROR", "Kết quả OMDb đã gắn với phim khác", 409);
  }

  const meta = await buildFromImdb(hit.imdbId);
  const saved = await saveMovie({
    ...current,
    ...meta,
    id: current.id,
    slug: current.slug,
    rating: current.rating,
    nowShowing: current.nowShowing,
  });
  await ensureSampleShowtimes(saved.slug);
  return saved;
}

export async function listSimilarMovies(slug: string): Promise<SimilarMovie[]> {
  const movie = await getMovieBySlug(slug);
  if (!movie) throw new DomainError("NOT_FOUND", "Không tìm thấy phim", 404);
  if (!movie.tmdbId) return [];

  const cached = similarCache.get(movie.tmdbId.toString());
  if (cached && Date.now() - cached.at < SIMILAR_TTL_MS) {
    return cached.items;
  }

  let raw: Awaited<ReturnType<typeof fetchTmdbSimilar>> = [];
  try {
    raw = await fetchTmdbSimilar(movie.tmdbId);
  } catch (error) {
    if (error instanceof DomainError && error.status === 503) throw error;
    return [];
  }

  const items: SimilarMovie[] = [];
  for (const item of raw) {
    const local = await getMovieByTmdbId(item.tmdbId);
    items.push({
      ...item,
      slug: local && local.slug !== slug ? local.slug : undefined,
      imdbRating: local?.imdbRating,
    });
  }

  similarCache.set(movie.tmdbId.toString(), { at: Date.now(), items });
  return items;
}
