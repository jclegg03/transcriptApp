import { API_URL } from "./api.config";

export type RoomWsParams =
  | { role: "speaker"; roomId: string; token: string }
  | { role: "listener"; roomId: string };

export function buildRoomWsUrl(params: RoomWsParams): string {
  const url = new URL(API_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("role", params.role);
  url.searchParams.set("roomId", params.roomId);
  if (params.role === "speaker") url.searchParams.set("token", params.token);
  return url.toString();
}
