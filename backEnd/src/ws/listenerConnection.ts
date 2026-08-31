import type { WebSocket } from "ws";
import type { RoomRegistry } from "../rooms/RoomRegistry.js";
import { env } from "../config/env.js";
import { send } from "./fanout.js";

export function handleListenerConnection(ws: WebSocket, roomId: string, registry: RoomRegistry): void {
  const room = registry.getRoom(roomId);
  if (!room) {
    ws.close(4004, "room-not-found");
    return;
  }

  if (room.status === "ended") {
    send(ws, { type: "room-ended", reason: "speaker-ended" });
    ws.close(1000, "room-ended");
    return;
  }

  if (room.listeners.size >= env.maxListenersPerRoom) {
    send(ws, { type: "error", code: "room-full", message: "This room has reached its listener limit." });
    ws.close(4008, "room-full");
    return;
  }

  const listener = registry.addListener(roomId, ws);
  if (!listener) {
    ws.close(4004, "room-not-found");
    return;
  }

  send(ws, {
    type: "room-state",
    status: room.status,
    listenerCount: room.listeners.size,
  });

  // Replay known transcript state so a late joiner isn't left blank.
  for (const segment of room.transcript) {
    send(ws, {
      type: "transcript",
      segmentId: segment.id,
      text: segment.text,
      isFinal: true,
      updatedAt: segment.updatedAt,
    });
  }
  if (room.currentInterim) {
    send(ws, {
      type: "transcript",
      segmentId: room.currentInterim.id,
      text: room.currentInterim.text,
      isFinal: false,
      updatedAt: room.currentInterim.updatedAt,
    });
  }

  ws.on("close", () => registry.removeListener(roomId, listener.id));
}
