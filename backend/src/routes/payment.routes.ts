import { Router } from "express";

import * as paymentController from "../controllers/payment.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export const paymentRouter = Router();

paymentRouter.post("/webhook", paymentController.webhook);
paymentRouter.post("/intent", requireAuth, paymentController.intent);
paymentRouter.get("/:bookingId", requireAuth, paymentController.status);
paymentRouter.post("/confirm", requireAuth, paymentController.confirm);
