import type { WebSocketServer, WebSocket } from "ws";

interface TrackedSocket extends WebSocket {
  isAlive?: boolean;
}

/** Pings every client periodically and terminates any that didn't pong since the last check. */
export function setupHeartbeat(wss: WebSocketServer, intervalMs = 30_000): NodeJS.Timeout {
  wss.on("connection", (ws: TrackedSocket) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  });

  const interval = setInterval(() => {
    for (const ws of wss.clients as Set<TrackedSocket>) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, intervalMs);

  wss.on("close", () => clearInterval(interval));
  return interval;
}
