import type { MovieRecord, ShowtimeRecord } from "../models/catalog.js";
import { readJsonFile, writeJsonFile } from "./json-store.js";

const FILE = "catalog.json";

type CatalogFile = {
  movies: MovieRecord[];
  showtimes: ShowtimeRecord[];
};

const seed: CatalogFile = {
  movies: [
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
  ],
  showtimes: [
    { id: "st-1", movieSlug: "dao-hai-tac", cinema: "CINEWAVE Landmark 81", room: "IMAX 1", startsAt: "2026-09-13T18:30:00+07:00", priceBase: 120000, closed: false },
    { id: "st-2", movieSlug: "dao-hai-tac", cinema: "CINEWAVE Landmark 81", room: "IMAX 1", startsAt: "2026-09-13T21:00:00+07:00", priceBase: 140000, closed: false },
    { id: "st-6", movieSlug: "dao-hai-tac", cinema: "CINEWAVE Landmark 81", room: "IMAX 1", startsAt: "2026-09-14T19:00:00+07:00", priceBase: 130000, closed: false },
    { id: "st-3", movieSlug: "dem-ha-noi", cinema: "CINEWAVE Vincom", room: "Hall 3", startsAt: "2026-09-13T19:15:00+07:00", priceBase: 95000, closed: false },
    { id: "st-7", movieSlug: "dem-ha-noi", cinema: "CINEWAVE Vincom", room: "Hall 3", startsAt: "2026-09-14T20:30:00+07:00", priceBase: 95000, closed: false },
    { id: "st-4", movieSlug: "vung-toi", cinema: "CINEWAVE Vincom", room: "Hall 2", startsAt: "2026-09-13T20:00:00+07:00", priceBase: 110000, closed: false },
    { id: "st-5", movieSlug: "khong-loi-thoat", cinema: "CINEWAVE Landmark 81", room: "Hall 5", startsAt: "2026-09-13T22:10:00+07:00", priceBase: 105000, closed: false },
  ],
};

async function readCatalog() {
  return readJsonFile<CatalogFile>(FILE, seed);
}

async function writeCatalog(catalog: CatalogFile) {
  await writeJsonFile(FILE, catalog);
}

export async function ensureCatalogSeed() {
  const current = await readJsonFile<CatalogFile | null>(FILE, null);
  if (!current?.movies?.length) {
    await writeCatalog(seed);
  }
}

export async function listMovies() {
  return (await readCatalog()).movies;
}

export async function getMovieById(id: string) {
  return (await listMovies()).find((movie) => movie.id === id) ?? null;
}

export async function getMovieBySlug(slug: string) {
  return (await listMovies()).find((movie) => movie.slug === slug) ?? null;
}

export async function saveMovie(movie: MovieRecord) {
  const catalog = await readCatalog();
  const index = catalog.movies.findIndex((item) => item.id === movie.id);
  if (index === -1) catalog.movies.push(movie);
  else catalog.movies[index] = movie;
  await writeCatalog(catalog);
  return movie;
}

export async function removeMovie(id: string) {
  const catalog = await readCatalog();
  const movie = catalog.movies.find((item) => item.id === id);
  if (!movie) return false;
  catalog.movies = catalog.movies.filter((item) => item.id !== id);
  catalog.showtimes = catalog.showtimes.filter((show) => show.movieSlug !== movie.slug);
  await writeCatalog(catalog);
  return true;
}

export async function listShowtimes() {
  return (await readCatalog()).showtimes;
}

export async function getShowtimeById(id: string) {
  return (await listShowtimes()).find((show) => show.id === id) ?? null;
}

export async function saveShowtime(showtime: ShowtimeRecord) {
  const catalog = await readCatalog();
  const index = catalog.showtimes.findIndex((item) => item.id === showtime.id);
  if (index === -1) catalog.showtimes.push(showtime);
  else catalog.showtimes[index] = showtime;
  await writeCatalog(catalog);
  return showtime;
}

export async function removeShowtime(id: string) {
  const catalog = await readCatalog();
  const next = catalog.showtimes.filter((show) => show.id !== id);
  if (next.length === catalog.showtimes.length) return false;
  catalog.showtimes = next;
  await writeCatalog(catalog);
  return true;
}
