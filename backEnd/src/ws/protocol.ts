// Speaker -> server
export type SpeakerClientMessage = { type: "end-room" };

// Server -> speaker
export type SpeakerServerMessage =
  | { type: "ready"; roomId: string }
  | { type: "listener-count"; count: number }
  | { type: "stt-status"; state: "connected" | "reconnecting" | "error"; message?: string }
  | { type: "error"; code: string; message: string };

// Server -> listener
export type ListenerServerMessage =
  | { type: "room-state"; status: "live" | "ended"; listenerCount: number }
  | { type: "transcript"; segmentId: string; text: string; isFinal: boolean; updatedAt: number }
  | { type: "speaker-joined" }
  | { type: "speaker-left" }
  | { type: "room-ended"; reason: "speaker-ended" | "speaker-timeout" | "server-shutdown" }
  | { type: "listener-count"; count: number }
  | { type: "error"; code: string; message: string };

// Listener -> server: no application messages beyond the WS ping/pong keepalive.
