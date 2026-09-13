import { Router } from "express";

import * as notificationController from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);
notificationRouter.get("/", notificationController.listMine);
notificationRouter.get("/stream", notificationController.stream);
notificationRouter.post("/read-all", notificationController.markAllRead);
notificationRouter.patch("/:id/read", notificationController.markRead);
