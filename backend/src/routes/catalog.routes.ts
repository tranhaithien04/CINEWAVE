import { Router } from "express";

import * as catalogController from "../controllers/catalog.controller.js";
import { optionalAuth } from "../middlewares/auth.js";

export const moviesRouter = Router();
moviesRouter.get("/", catalogController.listMovies);
moviesRouter.get("/:slug/similar", catalogController.listSimilar);
moviesRouter.get("/:slug", catalogController.getMovie);

export const showtimesRouter = Router();
showtimesRouter.get("/", catalogController.listShowtimes);
showtimesRouter.get("/:id/seats", optionalAuth, catalogController.listSeats);
showtimesRouter.get("/:id", catalogController.getShowtime);

export const cinemasRouter = Router();
cinemasRouter.get("/", catalogController.listCinemas);

export const concessionsRouter = Router();
concessionsRouter.get("/", catalogController.listConcessions);
