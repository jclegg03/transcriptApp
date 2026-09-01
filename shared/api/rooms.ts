// API contract for the /api/rooms endpoints, shared between backEnd and frontEnd
// so both sides change these shapes in exactly one place.

export type RoomStatus = "created" | "live" | "speaker-reconnecting" | "ended";

export interface RoomSummary {
  roomId: string;
  name: string;
  status: RoomStatus;
  hasSpeaker: boolean;
  listenerCount: number;
  createdAt: number; // epoch ms
}

export interface CreateRoomRequest {
  name: string;
}

export interface CreateRoomResponse {
  roomId: string;
  name: string;
  speakerToken: string;
}

export interface ListRoomsResponse {
  rooms: RoomSummary[];
}
