import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { mongoStatus } from "../db/mongo.js";
import { errorHandler } from "../middlewares/error.js";
import { mountRoutes } from "../routes/index.js";

function parseCorsOrigins(): Set<string> {
  const origins = new Set([
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
  ]);
  const extra = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [];
  for (const origin of extra) origins.add(origin);
  return origins;
}

export function createApp() {
  const app = express();

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  const allowedOrigins = parseCorsOrigins();

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
  app.use(
    express.json({
      verify(req, _res, buf) {
        (req as express.Request).rawBody = Buffer.from(buf);
      },
    }),
  );
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "cinewave-api", db: mongoStatus() });
  });

  mountRoutes(app);
  app.use(errorHandler);

  return app;
}
