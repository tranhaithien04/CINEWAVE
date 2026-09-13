import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { errorHandler } from "../middlewares/error.js";
import { mountRoutes } from "../routes/index.js";

export function createApp() {
  const app = express();

  const allowedOrigins = new Set([
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
  ]);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "cinewave-api" });
  });

  mountRoutes(app);
  app.use(errorHandler);

  return app;
}
