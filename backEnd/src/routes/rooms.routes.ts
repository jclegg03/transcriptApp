import { Router } from "express";
import rateLimit from "express-rate-limit";
import { roomRegistry } from "../rooms/RoomRegistry.js";
import type { Room } from "../rooms/types.js";
import { env } from "../config/env.js";
import type { CreateRoomResponse, ListRoomsResponse, RoomSummary } from "shared/api/rooms";

export const roomsRouter = Router();

const createRoomLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const MAX_ROOM_NAME_LENGTH = 80;

function toRoomSummary(room: Room): RoomSummary {
  return {
    roomId: room.id,
    name: room.name,
    status: room.status,
    hasSpeaker: room.speaker !== null,
    listenerCount: room.listeners.size,
    createdAt: room.createdAt,
  };
}

roomsRouter.get("/api/rooms", (_req, res) => {
  const rooms = roomRegistry.listActiveRooms().map(toRoomSummary);
  const body: ListRoomsResponse = { rooms };
  res.json(body);
});

roomsRouter.post("/api/rooms", createRoomLimiter, (req, res) => {
  const rawName = req.body?.name;
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (!name || name.length > MAX_ROOM_NAME_LENGTH) {
    res.status(400).json({ error: "invalid-name" });
    return;
  }

  if (roomRegistry.activeRoomCount() >= env.maxActiveRooms) {
    res.status(429).json({ error: "too-many-active-rooms" });
    return;
  }

  const room = roomRegistry.createRoom(name);
  const body: CreateRoomResponse = { roomId: room.id, name: room.name, speakerToken: room.speakerToken };
  res.status(201).json(body);
});

roomsRouter.get("/api/rooms/:id", (req, res) => {
  const room = roomRegistry.getRoom(req.params.id);
  if (!room) {
    res.status(404).json({ error: "not-found" });
    return;
  }
  res.json(toRoomSummary(room));
});
