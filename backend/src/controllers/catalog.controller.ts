import type { Request, Response } from "express";

import * as catalogService from "../services/catalog.service.js";

export async function listMovies(_req: Request, res: Response) {
  const movies = await catalogService.listPublicMovies();
  res.json({ movies });
}

export async function listSimilar(req: Request, res: Response) {
  const movies = await catalogService.listPublicSimilar(String(req.params.slug));
  res.json({ movies });
}

export async function getMovie(req: Request, res: Response) {
  const movie = await catalogService.getPublicMovie(String(req.params.slug));
  res.json({ movie });
}

export async function listShowtimes(req: Request, res: Response) {
  const movieSlug = typeof req.query.movieSlug === "string" ? req.query.movieSlug : undefined;
  const showtimes = await catalogService.listPublicShowtimes(movieSlug);
  res.json({ showtimes });
}

export async function getShowtime(req: Request, res: Response) {
  const showtime = await catalogService.getPublicShowtime(String(req.params.id));
  res.json({ showtime });
}

export async function listCinemas(_req: Request, res: Response) {
  const cinemas = await catalogService.listPublicCinemas();
  res.json({ cinemas });
}
