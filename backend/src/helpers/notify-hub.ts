import { EventEmitter } from "node:events";

import type { PublicNotification } from "../models/notification.js";

export const notifyHub = new EventEmitter();
notifyHub.setMaxListeners(200);

export function emitUserNotification(userId: string, notification: PublicNotification) {
  notifyHub.emit(`user:${userId}`, notification);
}
