import { Router } from "express";
import multer from "multer";

import * as ageVerificationController from "../controllers/age-verification.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

export const ageVerificationRouter = Router();

ageVerificationRouter.post("/", requireAuth, upload.single("file"), ageVerificationController.verify);
