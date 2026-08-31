import type { WebSocket } from "ws";
import type { SttSession } from "../stt/SttSession.js";

export type RoomStatus = "created" | "live" | "speaker-reconnecting" | "ended";

export interface TranscriptSegment {
  id: string;
  text: string;
  isFinal: boolean;
  startedAt: number;
  updatedAt: number;
}

export interface SpeakerConnection {
  socket: WebSocket;
  connectedAt: number;
}

export interface ListenerConnection {
  id: string;
  socket: WebSocket;
  connectedAt: number;
}

export interface Room {
  id: string;
  name: string;
  speakerToken: string;
  status: RoomStatus;
  createdAt: number;
  speaker: SpeakerConnection | null;
  listeners: Map<string, ListenerConnection>;
  transcript: TranscriptSegment[];
  currentInterim: TranscriptSegment | null;
  sttSession: SttSession | null;
  reconnectDeadline: number | null;
}
