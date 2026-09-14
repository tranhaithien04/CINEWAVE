import { Router } from "express";

import * as ticketController from "../controllers/ticket.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

export const ticketRouter = Router();

ticketRouter.get("/inspect", ticketController.inspect);
ticketRouter.get("/staff/inspect", requireAuth, requireRole("STAFF", "ADMIN"), ticketController.inspectAsStaff);
ticketRouter.post("/:code/check-in", requireAuth, requireRole("STAFF", "ADMIN"), ticketController.checkIn);
ticketRouter.post("/:code/refund-payout", requireAuth, requireRole("STAFF", "ADMIN"), ticketController.refundPayout);

ticketRouter.use(requireAuth);
ticketRouter.get("/", ticketController.listMine);
ticketRouter.post("/:code/cancel", ticketController.cancel);
ticketRouter.get("/:code/reschedule-options", ticketController.rescheduleOptions);
ticketRouter.post("/:code/reschedule", ticketController.reschedule);
ticketRouter.get("/:code", ticketController.getByCode);
