import { Router } from "express";

import * as catalogController from "../controllers/catalog.controller.js";

export const moviesRouter = Router();
moviesRouter.get("/", catalogController.listMovies);
moviesRouter.get("/:slug", catalogController.getMovie);

export const showtimesRouter = Router();
showtimesRouter.get("/", catalogController.listShowtimes);
showtimesRouter.get("/:id", catalogController.getShowtime);

export const cinemasRouter = Router();
cinemasRouter.get("/", catalogController.listCinemas);
