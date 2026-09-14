import type { Request, Response } from "express";

import * as adminService from "../services/admin.service.js";
import * as movieImportService from "../services/movie-import.service.js";
import * as systemSettingsService from "../services/system-settings.service.js";
import { DomainError } from "../models/errors.js";

export async function overview(_req: Request, res: Response) {
  res.json(await adminService.getOverview());
}

export async function revenue(_req: Request, res: Response) {
  res.json(await adminService.revenueReport());
}

export async function listMovies(_req: Request, res: Response) {
  res.json({ movies: await adminService.listMovies() });
}

export async function createMovie(req: Request, res: Response) {
  res.status(201).json({ movie: await adminService.createMovie(req.body) });
}

export async function updateMovie(req: Request, res: Response) {
  res.json({ movie: await adminService.updateMovie(String(req.params.id), req.body) });
}

export async function deleteMovie(req: Request, res: Response) {
  res.json(await adminService.deleteMovie(String(req.params.id)));
}

export async function searchCatalog(req: Request, res: Response) {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  res.json({ results: await movieImportService.searchCatalog(query) });
}

export async function importMovie(req: Request, res: Response) {
  res.status(201).json({ movie: await movieImportService.importFromImdb(req.body) });
}

export async function enrichMovie(req: Request, res: Response) {
  res.json({ movie: await movieImportService.enrichExistingMovie(String(req.params.id)) });
}

export async function syncNowPlaying(req: Request, res: Response) {
  res.json(await movieImportService.syncNowPlaying(req.body));
}

export async function listShowtimes(_req: Request, res: Response) {
  res.json({ showtimes: await adminService.listShowtimes() });
}

export async function createShowtime(req: Request, res: Response) {
  res.status(201).json({ showtime: await adminService.createShowtime(req.body) });
}

export async function updateShowtime(req: Request, res: Response) {
  res.json({ showtime: await adminService.updateShowtime(String(req.params.id), req.body) });
}

export async function deleteShowtime(req: Request, res: Response) {
  res.json(await adminService.deleteShowtime(String(req.params.id)));
}

export async function closeShowtime(req: Request, res: Response) {
  res.json({ showtime: await adminService.closeShowtime(String(req.params.id)) });
}

export async function listBookings(_req: Request, res: Response) {
  res.json({ bookings: await adminService.listBookings() });
}

export async function cancelBooking(req: Request, res: Response) {
  res.json({ booking: await adminService.cancelBooking(String(req.params.id)) });
}

export async function refundBooking(req: Request, res: Response) {
  res.json({ booking: await adminService.refundBooking(String(req.params.id)) });
}

export async function listTickets(_req: Request, res: Response) {
  res.json({ tickets: await adminService.listBookings() });
}

export async function checkInTicket(req: Request, res: Response) {
  res.json({ ticket: await adminService.checkInTicket(String(req.params.code)) });
}

export async function listUsers(_req: Request, res: Response) {
  res.json({ users: await adminService.listAdminUsers() });
}

export async function changeUserRole(req: Request, res: Response) {
  res.json({ user: await adminService.changeUserRole(String(req.params.id), req.body) });
}

export async function listRooms(_req: Request, res: Response) {
  res.json({ rooms: await adminService.listRooms() });
}

export async function updateRoomBlockedSeats(req: Request, res: Response) {
  res.json(await adminService.updateRoomBlockedSeats(req.body));
}

export async function listCinemas(_req: Request, res: Response) {
  res.json({ cinemas: await adminService.listCinemas() });
}

export async function listConcessions(_req: Request, res: Response) {
  res.json({ items: await adminService.listAdminConcessions() });
}

export async function upsertConcession(req: Request, res: Response) {
  res.status(201).json({ item: await adminService.upsertAdminConcession(req.body) });
}

export async function updateConcession(req: Request, res: Response) {
  res.json({
    item: await adminService.upsertAdminConcession({ ...req.body, id: String(req.params.id) }),
  });
}

export async function deleteConcession(req: Request, res: Response) {
  res.json(await adminService.removeAdminConcession(String(req.params.id)));
}

export async function listAgeVerifications(_req: Request, res: Response) {
  res.json({ verifications: await adminService.listAdminAgeVerifications() });
}

export async function broadcast(req: Request, res: Response) {
  res.json(await adminService.broadcastNotification(req.body));
}

export async function getSystemSettings(_req: Request, res: Response) {
  res.json(await systemSettingsService.getAdminSystemSettings());
}

export async function patchSystemSettings(req: Request, res: Response) {
  if (!req.userId) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  res.json(await systemSettingsService.patchAdminSystemSettings(req.userId, req.body));
}

export async function getSystemStatus(_req: Request, res: Response) {
  res.json(await systemSettingsService.getAdminSystemStatus());
}
