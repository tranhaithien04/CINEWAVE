import { Router } from "express";

import * as ageVerificationController from "../controllers/age-verification.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export const ageVerificationRouter = Router();

ageVerificationRouter.post("/", requireAuth, ageVerificationController.verify);
