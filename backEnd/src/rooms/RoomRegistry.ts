import { EventEmitter } from "node:events";
import { randomBytes, randomUUID } from "node:crypto";
import type { WebSocket } from "ws";
import type { Room, SpeakerConnection, ListenerConnection } from "./types.js";
import { generateRoomCode } from "./roomCode.js";

export const RECONNECT_WINDOW_MS = 30_000;
export const ENDED_ROOM_EVICTION_MS = 5 * 60_000;

export type RoomEndReason = "speaker-ended" | "speaker-timeout" | "server-shutdown";

export type AttachSpeakerResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not-found" | "bad-token" | "already-connected" };

interface RoomRegistryEvents {
  "speaker-attached": (room: Room) => void;
  "speaker-detached": (room: Room) => void; // entered speaker-reconnecting
  "room-ended": (room: Room, reason: RoomEndReason) => void;
  "listener-added": (room: Room, listener: ListenerConnection) => void;
  "listener-removed": (room: Room, listenerId: string) => void;
}

export declare interface RoomRegistry {
  on<E extends keyof RoomRegistryEvents>(event: E, listener: RoomRegistryEvents[E]): this;
  emit<E extends keyof RoomRegistryEvents>(
    event: E,
    ...args: Parameters<RoomRegistryEvents[E]>
  ): boolean;
}

export class RoomRegistry extends EventEmitter {
  private rooms = new Map<string, Room>();
  private reconnectTimers = new Map<string, NodeJS.Timeout>();
  private evictionTimers = new Map<string, NodeJS.Timeout>();

  createRoom(name: string): Room {
    let id = generateRoomCode();
    while (this.rooms.has(id)) {
      id = generateRoomCode();
    }
    const room: Room = {
      id,
      name,
      speakerToken: randomBytes(24).toString("base64url"),
      status: "created",
      createdAt: Date.now(),
      speaker: null,
      listeners: new Map(),
      transcript: [],
      currentInterim: null,
      sttSession: null,
      reconnectDeadline: null,
      audioBytesReceived: 0,
      audioChunksReceived: 0,
    };
    this.rooms.set(id, room);
    return room;
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  activeRoomCount(): number {
    return this.listActiveRoomIds().length;
  }

  listActiveRoomIds(): string[] {
    return this.listActiveRooms().map((room) => room.id);
  }

  listActiveRooms(): Room[] {
    return [...this.rooms.values()].filter((room) => room.status !== "ended");
  }

  attachSpeaker(roomId: string, token: string, socket: WebSocket): AttachSpeakerResult {
    const room = this.rooms.get(roomId);
    if (!room || room.status === "ended") {
      return { ok: false, reason: "not-found" };
    }
    if (room.speakerToken !== token) {
      return { ok: false, reason: "bad-token" };
    }
    if (room.speaker !== null) {
      return { ok: false, reason: "already-connected" };
    }

    this.clearReconnectTimer(roomId);
    const connection: SpeakerConnection = { socket, connectedAt: Date.now() };
    room.speaker = connection;
    room.status = "live";
    room.reconnectDeadline = null;
    this.emit("speaker-attached", room);
    return { ok: true, room };
  }

  /** Speaker's WebSocket dropped. Starts the reconnect grace period rather than ending the room. */
  detachSpeaker(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.status === "ended") return;

    room.speaker = null;
    room.sttSession = null;
    room.status = "speaker-reconnecting";
    room.reconnectDeadline = Date.now() + RECONNECT_WINDOW_MS;
    this.emit("speaker-detached", room);

    const timer = setTimeout(() => {
      this.endRoom(roomId, "speaker-timeout");
    }, RECONNECT_WINDOW_MS);
    this.reconnectTimers.set(roomId, timer);
  }

  endRoom(roomId: string, reason: RoomEndReason): void {
    const room = this.rooms.get(roomId);
    if (!room || room.status === "ended") return;

    this.clearReconnectTimer(roomId);
    room.speaker = null;
    room.sttSession = null;
    room.status = "ended";
    room.reconnectDeadline = null;
    this.emit("room-ended", room, reason);

    const evictionTimer = setTimeout(() => {
      this.rooms.delete(roomId);
      this.evictionTimers.delete(roomId);
    }, ENDED_ROOM_EVICTION_MS);
    this.evictionTimers.set(roomId, evictionTimer);
  }

  addListenerConnection(roomId: string, socket: WebSocket): ListenerConnection | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const listener: ListenerConnection = { id: randomUUID(), socket, connectedAt: Date.now() };
    room.listeners.set(listener.id, listener);
    this.emit("listener-added", room, listener);
    return listener;
  }

  removeListenerConnection(roomId: string, listenerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.listeners.delete(listenerId)) {
      this.emit("listener-removed", room, listenerId);
    }
  }

  private clearReconnectTimer(roomId: string): void {
    const timer = this.reconnectTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(roomId);
    }
  }
}

export const roomRegistry = new RoomRegistry();
