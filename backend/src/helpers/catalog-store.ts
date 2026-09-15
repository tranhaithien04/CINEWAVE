import { randomUUID } from "node:crypto";

import { MovieModel, ShowtimeModel } from "../db/models.js";
import { toPlain, toPlainList } from "../db/mongo.js";
import type { MovieRecord, ShowtimeRecord } from "../models/catalog.js";

const seedMovies: MovieRecord[] = [
  {
    id: "m1",
    slug: "dao-hai-tac",
    title: "Đảo Hải Tặc: Red",
    description: "Cuộc săn lùng kho báu cuối cùng kéo cả thế giới vào một trận hải chiến.",
    durationMin: 128,
    rating: "P",
    posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&h=900",
    backdropUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80",
    genres: ["Hành động", "Phiêu lưu"],
    nowShowing: true,
    trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: "m2",
    slug: "dem-ha-noi",
    title: "Đêm Hà Nội",
    description: "Một nhà báo lần theo manh mối mất tích giữa những con phố cũ.",
    durationMin: 112,
    rating: "T13",
    posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&h=900",
    backdropUrl: "https://images.unsplash.com/photo-1517604931442-73e72f77c3e9?auto=format&fit=crop&w=1600&q=80",
    genres: ["Tâm lý", "Bí ẩn"],
    nowShowing: true,
  },
  {
    id: "m3",
    slug: "vung-toi",
    title: "Vùng Tối",
    description: "Sinh tồn trong trạm vũ trụ khi tín hiệu Trái Đất biến mất.",
    durationMin: 136,
    rating: "T16",
    posterUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&h=900",
    backdropUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1600&q=80",
    genres: ["Khoa học viễn tưởng"],
    nowShowing: true,
  },
  {
    id: "m4",
    slug: "khong-loi-thoat",
    title: "Không Lối Thoát",
    description: "Đêm mưa, một tòa nhà khóa kín, và từng người biến mất.",
    durationMin: 104,
    rating: "T18",
    posterUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&h=900",
    backdropUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80",
    genres: ["Kinh dị", "Giật gân"],
    nowShowing: true,
  },
  {
    id: "m5",
    slug: "mua-he-cuoi",
    title: "Mùa Hè Cuối",
    description: "Ba người bạn trở về quê trước khi mỗi người đi một ngả.",
    durationMin: 118,
    rating: "K",
    posterUrl: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=600&h=900",
    backdropUrl: "https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=1600&q=80",
    genres: ["Gia đình", "Tình cảm"],
    nowShowing: false,
  },
  {
    id: "m6",
    slug: "anh-sang-cuoi-cung",
    title: "Ánh Sáng Cuối Cùng",
    description: "Một nhạc sĩ mất trí nhớ lần theo giai điệu duy nhất còn sót lại.",
    durationMin: 124,
    rating: "T13",
    posterUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=600&h=900",
    backdropUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1600&q=80",
    genres: ["Nhạc kịch", "Tâm lý"],
    nowShowing: false,
  },
];

const seedShowtimes: ShowtimeRecord[] = [
  { id: "st-1", movieSlug: "dao-hai-tac", cinema: "CINEWAVE Landmark 81", room: "IMAX 1", startsAt: "2026-09-13T18:30:00+07:00", priceBase: 120000, closed: false, blockedSeats: [] },
  { id: "st-2", movieSlug: "dao-hai-tac", cinema: "CINEWAVE Landmark 81", room: "IMAX 1", startsAt: "2026-09-13T21:00:00+07:00", priceBase: 140000, closed: false, blockedSeats: [] },
  { id: "st-6", movieSlug: "dao-hai-tac", cinema: "CINEWAVE Landmark 81", room: "IMAX 1", startsAt: "2026-09-14T19:00:00+07:00", priceBase: 130000, closed: false, blockedSeats: [] },
  { id: "st-3", movieSlug: "dem-ha-noi", cinema: "CINEWAVE Vincom", room: "Hall 3", startsAt: "2026-09-13T19:15:00+07:00", priceBase: 95000, closed: false, blockedSeats: [] },
  { id: "st-7", movieSlug: "dem-ha-noi", cinema: "CINEWAVE Vincom", room: "Hall 3", startsAt: "2026-09-14T20:30:00+07:00", priceBase: 95000, closed: false, blockedSeats: [] },
  { id: "st-4", movieSlug: "vung-toi", cinema: "CINEWAVE Vincom", room: "Hall 2", startsAt: "2026-09-13T20:00:00+07:00", priceBase: 110000, closed: false, blockedSeats: [] },
  { id: "st-5", movieSlug: "khong-loi-thoat", cinema: "CINEWAVE Landmark 81", room: "Hall 5", startsAt: "2026-09-13T22:10:00+07:00", priceBase: 105000, closed: false, blockedSeats: [] },
];

export async function ensureCatalogSeed() {
  const count = await MovieModel.countDocuments();
  if (count === 0) {
    await MovieModel.insertMany(seedMovies);
    await ShowtimeModel.insertMany(seedShowtimes);
  }
  await ensureSampleShowtimesForNowShowing();
}

export async function listMovies() {
  const docs = await MovieModel.find().lean();
  return toPlainList<MovieRecord>(docs);
}

export async function getMovieById(id: string) {
  const doc = await MovieModel.findOne({ id }).lean();
  return toPlain<MovieRecord>(doc);
}

export async function getMovieBySlug(slug: string) {
  const doc = await MovieModel.findOne({ slug }).lean();
  return toPlain<MovieRecord>(doc);
}

export async function getMovieByImdbId(imdbId: string) {
  const doc = await MovieModel.findOne({ imdbId }).lean();
  return toPlain<MovieRecord>(doc);
}

export async function getMovieByTmdbId(tmdbId: number) {
  const doc = await MovieModel.findOne({ tmdbId }).lean();
  return toPlain<MovieRecord>(doc);
}

export async function saveMovie(movie: MovieRecord) {
  const doc = await MovieModel.findOneAndUpdate({ id: movie.id }, movie, {
    new: true,
    upsert: true,
  }).lean();
  return toPlain<MovieRecord>(doc)!;
}

export async function removeMovie(id: string) {
  const movie = await MovieModel.findOne({ id }).lean();
  if (!movie) return false;
  await MovieModel.deleteOne({ id });
  await ShowtimeModel.deleteMany({ movieSlug: movie.slug });
  return true;
}

export async function listShowtimes() {
  const docs = await ShowtimeModel.find().lean();
  return toPlainList<ShowtimeRecord>(docs);
}

export async function getShowtimeById(id: string) {
  const doc = await ShowtimeModel.findOne({ id }).lean();
  return toPlain<ShowtimeRecord>(doc);
}

export async function saveShowtime(showtime: ShowtimeRecord) {
  const doc = await ShowtimeModel.findOneAndUpdate({ id: showtime.id }, showtime, {
    new: true,
    upsert: true,
  }).lean();
  return toPlain<ShowtimeRecord>(doc)!;
}

export async function listShowtimesByMovieSlug(movieSlug: string) {
  const docs = await ShowtimeModel.find({ movieSlug }).lean();
  return toPlainList<ShowtimeRecord>(docs);
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function vietnamYmd(offsetDays = 0) {
  const vn = new Date(Date.now() + 7 * 60 * 60 * 1000);
  vn.setUTCDate(vn.getUTCDate() + offsetDays);
  return { y: vn.getUTCFullYear(), m: vn.getUTCMonth() + 1, d: vn.getUTCDate() };
}

function vietnamIso(offsetDays: number, hhmm: string) {
  const { y, m, d } = vietnamYmd(offsetDays);
  return `${y}-${pad2(m)}-${pad2(d)}T${hhmm}:00+07:00`;
}

const UPCOMING_MIN_MS = 15 * 60 * 1000;

const weeklySlotTemplates = [
  { time: "18:30", priceBase: 120000, room: "IMAX 1" },
  { time: "21:00", priceBase: 140000, room: "IMAX 1" },
];

function buildUpcomingShowtimeDocs(movieSlug: string, existingStarts: Set<string>) {
  const docs: ShowtimeRecord[] = [];
  for (let day = 0; day < 7; day += 1) {
    for (const template of weeklySlotTemplates) {
      const startsAt = vietnamIso(day, template.time);
      if (new Date(startsAt).getTime() <= Date.now() + UPCOMING_MIN_MS) continue;
      if (existingStarts.has(startsAt)) continue;
      existingStarts.add(startsAt);
      docs.push({
        id: `st-${randomUUID().slice(0, 8)}`,
        movieSlug,
        cinema: "CINEWAVE Landmark 81",
        room: template.room,
        startsAt,
        priceBase: template.priceBase,
        closed: false,
        blockedSeats: [],
      });
    }
  }
  return docs;
}

export async function ensureShowtimesForNextWeek(movieSlug: string) {
  const existing = await listShowtimesByMovieSlug(movieSlug);
  const existingStarts = new Set(existing.map((item) => item.startsAt));
  const docs = buildUpcomingShowtimeDocs(movieSlug, existingStarts);
  if (docs.length) await ShowtimeModel.insertMany(docs);
  return docs;
}

export async function ensureSampleShowtimes(movieSlug: string) {
  const existing = await listShowtimesByMovieSlug(movieSlug);
  if (existing.length) return existing;
  return ensureShowtimesForNextWeek(movieSlug);
}

export async function ensureSampleShowtimesForNowShowing() {
  const movies = await listMovies();
  let moviesFilled = 0;
  let showtimesCreated = 0;
  for (const movie of movies) {
    if (!movie.nowShowing) continue;
    try {
      const before = await listShowtimesByMovieSlug(movie.slug);
      if (before.length) continue;
      const created = await ensureSampleShowtimes(movie.slug);
      moviesFilled += 1;
      showtimesCreated += created.length;
    } catch (error) {
      console.warn(`Không tạo suất mẫu cho ${movie.slug}:`, error instanceof Error ? error.message : error);
    }
  }
  return { moviesFilled, showtimesCreated };
}

export async function removeShowtime(id: string) {
  const result = await ShowtimeModel.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function removeShowtimesByIds(ids: string[]) {
  if (!ids.length) return 0;
  const result = await ShowtimeModel.deleteMany({ id: { $in: ids } });
  return result.deletedCount ?? 0;
}
