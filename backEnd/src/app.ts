import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { roomsRouter } from "./routes/rooms.routes.js";
import { healthRouter } from "./routes/health.routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.allowedOrigins.length > 0 ? env.allowedOrigins : true,
    })
  );
  app.use(express.json());

  app.use(healthRouter);
  app.use(roomsRouter);

  return app;
}
