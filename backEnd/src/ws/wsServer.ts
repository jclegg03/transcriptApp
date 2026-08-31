import { WebSocketServer } from "ws";
import type { Server } from "node:http";
import type { Duplex } from "node:stream";
import { URL } from "node:url";
import type { RoomRegistry } from "../rooms/RoomRegistry.js";
import { env } from "../config/env.js";
import { handleSpeakerConnection } from "./speakerConnection.js";
import { handleListenerConnection } from "./listenerConnection.js";
import { broadcastToListeners, broadcastListenerCount } from "./fanout.js";
import { setupHeartbeat } from "./heartbeat.js";

const MAX_AUDIO_FRAME_BYTES = 64 * 1024;

function rejectUpgrade(socket: Duplex, statusCode: number, reason: string): void {
  socket.write(`HTTP/1.1 ${statusCode} ${reason}\r\n\r\n`);
  socket.destroy();
}

function isOriginAllowed(origin: string | undefined): boolean {
  if (env.allowedOrigins.length === 0) return true; // no allowlist configured: permit (dev default)
  return origin !== undefined && env.allowedOrigins.includes(origin);
}

export function attachWebSocketServer(server: Server, registry: RoomRegistry): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_AUDIO_FRAME_BYTES });

  registry.on("speaker-attached", (room) => {
    broadcastToListeners(room, { type: "speaker-joined" });
  });
  registry.on("speaker-detached", (room) => {
    broadcastToListeners(room, { type: "speaker-left" });
  });
  registry.on("room-ended", (room, reason) => {
    broadcastToListeners(room, { type: "room-ended", reason });
    for (const listener of room.listeners.values()) listener.socket.close(1000, "room-ended");
    room.speaker?.socket.close(1000, "room-ended");
  });
  registry.on("listener-added", (room) => broadcastListenerCount(room));
  registry.on("listener-removed", (room) => broadcastListenerCount(room));

  server.on("upgrade", (req, socket, head) => {
    if (!isOriginAllowed(req.headers.origin)) {
      rejectUpgrade(socket, 403, "origin-not-allowed");
      return;
    }

    let url: URL;
    try {
      url = new URL(req.url ?? "", `http://${req.headers.host}`);
    } catch {
      rejectUpgrade(socket, 400, "bad-request");
      return;
    }

    const role = url.searchParams.get("role");
    const roomId = url.searchParams.get("roomId");
    if (!roomId || (role !== "speaker" && role !== "listener")) {
      rejectUpgrade(socket, 400, "bad-request");
      return;
    }

    const room = registry.getRoom(roomId);

    if (role === "speaker") {
      if (!room || room.status === "ended") {
        rejectUpgrade(socket, 404, "room-not-found");
        return;
      }
      const token = url.searchParams.get("token") ?? "";
      if (room.speakerToken !== token) {
        rejectUpgrade(socket, 401, "bad-token");
        return;
      }
      if (room.speaker !== null) {
        rejectUpgrade(socket, 409, "speaker-already-connected");
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        handleSpeakerConnection(ws, roomId, token, registry);
      });
      return;
    }

    // listener
    if (!room) {
      rejectUpgrade(socket, 404, "room-not-found");
      return;
    }
    // An ended room is still accepted so handleListenerConnection can send a
    // friendly room-ended message instead of a bare connection refusal.
    wss.handleUpgrade(req, socket, head, (ws) => {
      handleListenerConnection(ws, roomId, registry);
    });
  });

  setupHeartbeat(wss);
  return wss;
}
