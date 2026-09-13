import { Router } from "express";

import * as paymentController from "../controllers/payment.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export const paymentRouter = Router();

paymentRouter.post("/webhook", paymentController.webhook);
paymentRouter.post("/confirm", requireAuth, paymentController.confirm);
