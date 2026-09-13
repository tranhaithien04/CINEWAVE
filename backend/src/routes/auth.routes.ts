import { Router } from "express";

import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);
authRouter.post("/refresh", authController.refresh);
authRouter.get("/me", requireAuth, authController.me);
