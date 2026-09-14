import { Router } from "express";

import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/verify-email", authController.verifyEmail);
authRouter.get("/verify-email", authController.verifyEmail);
authRouter.post("/resend-verification", authController.resendVerification);
authRouter.get("/google", authController.googleStart);
authRouter.get("/google/callback", authController.googleCallback);
authRouter.post("/logout", authController.logout);
authRouter.post("/refresh", authController.refresh);
authRouter.get("/me", requireAuth, authController.me);
