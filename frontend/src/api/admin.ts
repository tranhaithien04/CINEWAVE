import type { Movie, Showtime } from "@/@types/movie";
import type { AuthUser } from "@/api/auth";

import { api } from "./client";

export type AdminOverview = {
  movies: number;
  showtimes: number;
  tickets: number;
  users: number;
  revenue: number;
};

export type AdminBooking = {
  id: string;
  code: string;
  movieSlug: string;
  showtimeId: string;
  seats: string[];
  status: string;
  total: number;
  userEmail: string | null;
  createdAt: string;
};

export type RevenueReport = {
  total: number;
  paidCount: number;
  byMovie: Array<{ movieSlug: string; total: number }>;
};

export type MovieInput = {
  title: string;
  slug?: string;
  description: string;
  durationMin: number;
  rating: Movie["rating"];
  posterUrl: string;
  backdropUrl: string;
  genres: string[];
  nowShowing: boolean;
  trailerUrl?: string;
};

export type OmdbSearchHit = {
  imdbId: string;
  title: string;
  year: string;
  posterUrl: string | null;
};

export type MovieImportInput = {
  imdbId: string;
  rating: Movie["rating"];
  nowShowing?: boolean;
};

export type ShowtimeInput = {
  movieSlug: string;
  cinema: string;
  room: string;
  startsAt: string;
  priceBase: number;
  closed?: boolean;
};

export function fetchAdminOverview() {
  return api<AdminOverview>("/admin/overview");
}

export function fetchAdminRevenue() {
  return api<RevenueReport>("/admin/reports/revenue");
}

export function fetchAdminMovies() {
  return api<{ movies: Movie[] }>("/admin/movies");
}

export function createAdminMovie(body: MovieInput) {
  return api<{ movie: Movie }>("/admin/movies", { method: "POST", body });
}

export function searchAdminCatalog(query: string) {
  return api<{ results: OmdbSearchHit[] }>(`/admin/catalog/search?q=${encodeURIComponent(query)}`);
}

export function importAdminMovie(body: MovieImportInput) {
  return api<{ movie: Movie }>("/admin/movies/import", { method: "POST", body });
}

export function enrichAdminMovie(id: string) {
  return api<{ movie: Movie }>(`/admin/movies/${id}/enrich`, { method: "POST" });
}

export type SyncNowPlayingResult = {
  region: string;
  scanned: number;
  imported: Movie[];
  skipped: number;
  skippedTitles: string[];
  failed: Array<{ title: string; reason: string }>;
  showtimesFilled?: number;
};

export function syncAdminNowPlaying(body?: { rating?: Movie["rating"]; limit?: number; region?: string }) {
  return api<SyncNowPlayingResult>("/admin/movies/sync-now-playing", { method: "POST", body: body ?? {} });
}

export function updateAdminMovie(id: string, body: Partial<MovieInput>) {
  return api<{ movie: Movie }>(`/admin/movies/${id}`, { method: "PATCH", body });
}

export function deleteAdminMovie(id: string) {
  return api<{ ok: boolean }>(`/admin/movies/${id}`, { method: "DELETE" });
}

export function fetchAdminShowtimes() {
  return api<{ showtimes: Showtime[] }>("/admin/showtimes");
}

export function createAdminShowtime(body: ShowtimeInput) {
  return api<{ showtime: Showtime }>("/admin/showtimes", { method: "POST", body });
}

export function updateAdminShowtime(id: string, body: Partial<ShowtimeInput>) {
  return api<{ showtime: Showtime }>(`/admin/showtimes/${id}`, { method: "PATCH", body });
}

export function deleteAdminShowtime(id: string) {
  return api<{ ok: boolean }>(`/admin/showtimes/${id}`, { method: "DELETE" });
}

export function closeAdminShowtime(id: string) {
  return api<{ showtime: Showtime }>(`/admin/showtimes/${id}/close`, { method: "POST" });
}

export function fetchAdminBookings() {
  return api<{ bookings: AdminBooking[] }>("/admin/bookings");
}

export function cancelAdminBooking(id: string) {
  return api<{ booking: AdminBooking }>(`/admin/bookings/${id}/cancel`, { method: "POST" });
}

export function refundAdminBooking(id: string) {
  return api<{ booking: AdminBooking }>(`/admin/bookings/${id}/refund`, { method: "POST" });
}

export function fetchAdminTickets() {
  return api<{ tickets: AdminBooking[] }>("/admin/tickets");
}

export function checkInAdminTicket(code: string) {
  return api<{ ticket: AdminBooking }>(`/admin/tickets/${encodeURIComponent(code)}/check-in`, { method: "POST" });
}

export function fetchAdminUsers() {
  return api<{ users: AuthUser[] }>("/admin/users");
}

export function changeAdminUserRole(id: string, role: AuthUser["role"]) {
  return api<{ user: AuthUser }>(`/admin/users/${id}`, { method: "PATCH", body: { role } });
}
