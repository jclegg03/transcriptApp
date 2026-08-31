import { Router } from "express";
import rateLimit from "express-rate-limit";
import { roomRegistry } from "../rooms/RoomRegistry.js";
import { env } from "../config/env.js";

export const roomsRouter = Router();

const createRoomLimiter = rateLimit({
  windowMs: 60_000,
  limit: 1,
  standardHeaders: true,
  legacyHeaders: false,
});

roomsRouter.post("/api/rooms", createRoomLimiter, (_req, res) => {
  if (roomRegistry.activeRoomCount() >= env.maxActiveRooms) {
    res.status(429).json({ error: "too-many-active-rooms" });
    return;
  }
  const room = roomRegistry.createRoom();
  res.status(201).json({ roomId: room.id, speakerToken: room.speakerToken });
});

roomsRouter.get("/api/rooms/:id", (req, res) => {
  const room = roomRegistry.getRoom(req.params.id);
  if (!room) {
    res.status(404).json({ error: "not-found" });
    return;
  }
  res.json({ roomId: room.id, status: room.status, listenerCount: room.listeners.size });
});
