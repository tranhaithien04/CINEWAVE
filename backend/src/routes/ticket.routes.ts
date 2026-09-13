import { Router } from "express";

import * as ticketController from "../controllers/ticket.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export const ticketRouter = Router();

ticketRouter.use(requireAuth);
ticketRouter.get("/", ticketController.listMine);
ticketRouter.get("/:code", ticketController.getByCode);
