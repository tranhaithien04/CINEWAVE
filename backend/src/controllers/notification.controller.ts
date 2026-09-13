import type { Request, Response } from "express";

import { notifyHub } from "../helpers/notify-hub.js";
import { DomainError } from "../models/errors.js";
import * as notificationService from "../services/notification.service.js";

function requireUser(req: Request) {
  if (!req.userId) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  return req.userId;
}

export async function listMine(req: Request, res: Response) {
  res.json(await notificationService.listMyNotifications(requireUser(req)));
}

export async function markRead(req: Request, res: Response) {
  const notification = await notificationService.readNotification(requireUser(req), String(req.params.id));
  res.json({ notification });
}

export async function markAllRead(req: Request, res: Response) {
  res.json(await notificationService.readAllNotifications(requireUser(req)));
}

export function stream(req: Request, res: Response) {
  const userId = requireUser(req);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write(":ok\n\n");

  const onNote = (payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };
  notifyHub.on(`user:${userId}`, onNote);
  const heartbeat = setInterval(() => {
    res.write(":ping\n\n");
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    notifyHub.off(`user:${userId}`, onNote);
  });
}
