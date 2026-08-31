import { createServer } from "node:http";
import { createApp } from "./app.js";
import { attachWebSocketServer } from "./ws/wsServer.js";
import { roomRegistry } from "./rooms/RoomRegistry.js";
import { env } from "./config/env.js";

const app = createApp();
const server = createServer(app);
attachWebSocketServer(server, roomRegistry);

server.listen(env.port, () => {
  console.log(`TranscriptApp backend listening on port ${env.port}`);
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}, shutting down...`);
  for (const room of roomRegistry.listActiveRoomIds()) {
    roomRegistry.endRoom(room, "server-shutdown");
  }
  server.close(() => process.exit(0));
  // Force-exit if connections don't close promptly.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
