import type { Movie, Showtime } from "@/@types/movie";
import type { Seat } from "@/@types/seat";

export const movies: Movie[] = [
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

export const showtimes: Showtime[] = [
  { id: "st-1", movieSlug: "dao-hai-tac", cinema: "CINEWAVE Landmark 81", room: "IMAX 1", startsAt: "2026-09-13T18:30:00+07:00", priceBase: 120000 },
  { id: "st-2", movieSlug: "dao-hai-tac", cinema: "CINEWAVE Landmark 81", room: "IMAX 1", startsAt: "2026-09-13T21:00:00+07:00", priceBase: 140000 },
  { id: "st-6", movieSlug: "dao-hai-tac", cinema: "CINEWAVE Landmark 81", room: "IMAX 1", startsAt: "2026-09-14T19:00:00+07:00", priceBase: 130000 },
  { id: "st-3", movieSlug: "dem-ha-noi", cinema: "CINEWAVE Vincom", room: "Hall 3", startsAt: "2026-09-13T19:15:00+07:00", priceBase: 95000 },
  { id: "st-7", movieSlug: "dem-ha-noi", cinema: "CINEWAVE Vincom", room: "Hall 3", startsAt: "2026-09-14T20:30:00+07:00", priceBase: 95000 },
  { id: "st-4", movieSlug: "vung-toi", cinema: "CINEWAVE Vincom", room: "Hall 2", startsAt: "2026-09-13T20:00:00+07:00", priceBase: 110000 },
  { id: "st-5", movieSlug: "khong-loi-thoat", cinema: "CINEWAVE Landmark 81", room: "Hall 5", startsAt: "2026-09-13T22:10:00+07:00", priceBase: 105000 },
];

export type TicketStatus = "PAID" | "USED" | "EXPIRED";

export type MockTicket = {
  code: string;
  movieSlug: string;
  showtimeId: string;
  seats: string[];
  status: TicketStatus;
  total: number;
};

export const mockTickets: MockTicket[] = [
  { code: "CW-9F2K", movieSlug: "dao-hai-tac", showtimeId: "st-1", seats: ["F1", "F2"], status: "PAID", total: 312000 },
  { code: "CW-3L8P", movieSlug: "dem-ha-noi", showtimeId: "st-3", seats: ["C4"], status: "USED", total: 95000 },
];

export function getTicketByCode(code: string) {
  return mockTickets.find((ticket) => ticket.code === code) ?? null;
}

export function getMovieBySlug(slug: string) {
  return movies.find((movie) => movie.slug === slug) ?? null;
}

export function getShowtimesByMovie(slug: string) {
  return showtimes.filter((item) => item.movieSlug === slug);
}

export function getShowtimeById(id: string) {
  return showtimes.find((item) => item.id === id) ?? showtimes[0] ?? null;
}

export function buildSeatMap(
  occupancy: Record<string, Seat["state"]> = {},
  blockedSeats: string[] = [],
): Seat[] {
  const rows = ["A", "B", "C", "D", "E", "F"];
  const blocked = new Set(blockedSeats.map((seat) => seat.trim().toUpperCase()).filter(Boolean));

  return rows.flatMap((row) =>
    Array.from({ length: 10 }, (_, index) => {
      const number = index + 1;
      const label = `${row}${number}`;
      const type = row === "F" ? "VIP" : row === "A" && (number === 5 || number === 6) ? "COUPLE" : "STANDARD";
      const partner = number === 5 ? "A6" : number === 6 ? "A5" : null;
      const state = blocked.has(label) ? "BLOCKED" : (occupancy[label] ?? "AVAILABLE");
      return {
        id: `seat-${label}`,
        label,
        row,
        number,
        type,
        partner: type === "COUPLE" ? partner : null,
        state,
      } satisfies Seat;
    }),
  );
}

export function seatPrice(base: number, type: Seat["type"]) {
  if (type === "VIP") return Math.round(base * 1.3);
  if (type === "COUPLE") return base * 2;
  return base;
}

const vndFmt = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function formatVnd(value: number) {
  return vndFmt.format(value);
}
