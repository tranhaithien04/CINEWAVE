import { Router } from "express";

import * as bookingController from "../controllers/booking.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export const bookingRouter = Router();

bookingRouter.use(requireAuth);
bookingRouter.post("/hold", bookingController.hold);
bookingRouter.patch("/:id/concessions", bookingController.patchConcessions);
bookingRouter.get("/:id", bookingController.getOne);
