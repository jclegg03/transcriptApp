import type { CreateRoomResponse, ListRoomsResponse, RoomSummary } from "shared/api/rooms";
import { API_URL } from "./api.config";

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.error === "string" ? body.error : `request failed (${res.status})`;
  } catch {
    return `request failed (${res.status})`;
  }
}

export async function createRoom(name: string): Promise<CreateRoomResponse> {
  const res = await fetch(`${API_URL}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (res.status !== 201) throw new Error("Room creation failed: " + (await errorMessage(res)));
  return (await res.json()) as CreateRoomResponse;
}

export async function listRooms(): Promise<RoomSummary[]> {
  const res = await fetch(`${API_URL}/api/rooms`);
  if (!res.ok) throw new Error("Failed to load rooms: " + (await errorMessage(res)));
  const body = (await res.json()) as ListRoomsResponse;
  return body.rooms;
}

export async function getRoom(roomId: string): Promise<RoomSummary> {
  const res = await fetch(`${API_URL}/api/rooms/${encodeURIComponent(roomId)}`);
  if (!res.ok) throw new Error("Room not found: " + (await errorMessage(res)));
  return (await res.json()) as RoomSummary;
}
