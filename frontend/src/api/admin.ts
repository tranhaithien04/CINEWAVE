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

export type ConcessionLine = {
  id: string;
  qty: number;
  name: string;
  unitPrice: number;
};

export type AdminBooking = {
  id: string;
  code: string;
  movieSlug: string;
  showtimeId: string;
  seats: string[];
  status: string;
  total: number;
  seatTotal?: number;
  concessionTotal?: number;
  concessions?: ConcessionLine[];
  userEmail: string | null;
  createdAt: string;
  holdExpiresAt?: string | null;
  paymentCode?: string | null;
  paymentExpiresAt?: string | null;
  checkedInAt?: string | null;
  cancelledAt?: string | null;
  refundExpiresAt?: string | null;
  refundedAt?: string | null;
  canCancel?: boolean;
  canReschedule?: boolean;
  qr?: { code: string; sig: string; text: string } | null;
  refundQr?: { code: string; sig: string; text: string } | null;
};

export type RevenueReport = {
  total: number;
  paidCount: number;
  seatRevenue?: number;
  concessionRevenue?: number;
  byMovie: Array<{ movieSlug: string; total: number }>;
  byCinema?: Array<{ cinema: string; total: number }>;
};

export type AdminConcession = {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
};

export type AdminCinema = {
  name: string;
  roomCount: number;
  showtimeCount: number;
  rooms: string[];
};

export type AdminAgeVerification = {
  id: string;
  userId: string;
  bookingId: string | null;
  showtimeId: string | null;
  movieSlug: string | null;
  rating: string | null;
  requiredAge: number;
  computedAge: number | null;
  passed: boolean;
  confidence: number | null;
  idMasked: string | null;
  failureReason: string | null;
  createdAt: string;
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
  blockedSeats?: string[];
};

export type AdminRoom = {
  cinema: string;
  room: string;
  blockedSeats: string[];
  showtimeCount: number;
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

export function fetchAdminRooms() {
  return api<{ rooms: AdminRoom[] }>("/admin/rooms");
}

export function updateAdminRoomBlockedSeats(body: {
  cinema: string;
  room: string;
  blockedSeats: string[];
}) {
  return api<{
    cinema: string;
    room: string;
    blockedSeats: string[];
    updatedCount: number;
    showtimes: Showtime[];
  }>("/admin/rooms", { method: "PATCH", body });
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

export function fetchAdminCinemas() {
  return api<{ cinemas: AdminCinema[] }>("/admin/cinemas");
}

export function fetchAdminConcessions() {
  return api<{ items: AdminConcession[] }>("/admin/concessions");
}

export function createAdminConcession(body: Omit<AdminConcession, "id"> & { id?: string }) {
  return api<{ item: AdminConcession }>("/admin/concessions", { method: "POST", body });
}

export function updateAdminConcession(id: string, body: Partial<AdminConcession>) {
  return api<{ item: AdminConcession }>(`/admin/concessions/${id}`, { method: "PATCH", body });
}

export function deleteAdminConcession(id: string) {
  return api<{ ok: boolean }>(`/admin/concessions/${id}`, { method: "DELETE" });
}

export function fetchAdminAgeVerifications() {
  return api<{ verifications: AdminAgeVerification[] }>("/admin/age-verifications");
}

export function broadcastAdminNotification(body: { title: string; body: string; href?: string }) {
  return api<{ sent: number; totalUsers: number }>("/admin/notifications/broadcast", {
    method: "POST",
    body,
  });
}

export type SystemSettingRow = {
  key: string;
  group: string;
  label: string;
  description: string;
  sensitivity: "public" | "secret" | "locked";
  editable: boolean;
  hotReload: boolean;
  configured: boolean;
  value: string | null;
  hint: string;
  source: "env" | "override";
};

export type SystemStatus = {
  nodeEnv: string;
  uptimeSec: number;
  checks: Array<{ id: string; label: string; ok: boolean }>;
};

export type SystemSettingsAudit = {
  at: string;
  adminId: string;
  adminEmail: string;
  key: string;
  action: "update" | "clear";
};

export function fetchAdminSystemSettings() {
  return api<{
    settings: SystemSettingRow[];
    status: SystemStatus;
    audit: SystemSettingsAudit[];
    security: { note: string; requirePasswordForSecrets: boolean };
  }>("/admin/system/settings");
}

export function updateAdminSystemSettings(body: {
  settings: Record<string, string | null>;
  confirmPassword: string;
}) {
  return api<{
    changed: string[];
    settings: SystemSettingRow[];
    status: SystemStatus;
  }>("/admin/system/settings", { method: "PATCH", body });
}
