import type { WebSocket } from "ws";
import type { Room } from "../rooms/types.js";
import type { ListenerServerMessage, SpeakerServerMessage } from "./protocol.js";

// A listener whose send buffer grows past this is falling behind; skip further
// sends to it rather than let memory grow unbounded.
const MAX_BUFFERED_BYTES = 1_000_000;

export function send(socket: WebSocket, message: SpeakerServerMessage | ListenerServerMessage): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

export function sendToSpeaker(room: Room, message: SpeakerServerMessage): void {
  if (room.speaker) send(room.speaker.socket, message);
}

export function broadcastToListeners(room: Room, message: ListenerServerMessage): void {
  for (const listener of room.listeners.values()) {
    if (listener.socket.bufferedAmount > MAX_BUFFERED_BYTES) continue;
    send(listener.socket, message);
  }
}

export function broadcastListenerCount(room: Room): void {
  const count = room.listeners.size;
  broadcastToListeners(room, { type: "listener-count", count });
  sendToSpeaker(room, { type: "listener-count", count });
}
