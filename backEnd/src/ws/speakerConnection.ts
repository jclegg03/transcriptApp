import { randomUUID } from "node:crypto";
import type { WebSocket, RawData } from "ws";
import type { RoomRegistry } from "../rooms/RoomRegistry.js";
import type { Room, TranscriptSegment } from "../rooms/types.js";
import { SttSession, type SttResult } from "../stt/SttSession.js";
import type { SpeakerClientMessage } from "./protocol.js";
import { send, sendToSpeaker, broadcastToListeners } from "./fanout.js";

export function handleSpeakerConnection(
  ws: WebSocket,
  roomId: string,
  token: string,
  registry: RoomRegistry
): void {
  const result = registry.attachSpeaker(roomId, token, ws);
  if (!result.ok) {
    ws.close(4001, result.reason);
    return;
  }
  const room = result.room;
  send(ws, { type: "ready", roomId });

  room.sttSession = startSttSession(room, registry);

  ws.on("message", (data: RawData, isBinary: boolean) => {
    if (room.status === "ended") return;
    if (isBinary) {
      const chunk = data as Buffer;
      room.audioBytesReceived += chunk.length;
      room.audioChunksReceived += 1;
      if (room.audioChunksReceived % 10 === 0) {
        console.log(
          `[audio] room ${roomId}: ${room.audioChunksReceived} chunks, ${room.audioBytesReceived} bytes total`
        );
      }
      room.sttSession?.write(chunk);
      return;
    }
    try {
      const msg = JSON.parse(data.toString()) as SpeakerClientMessage;
      if (msg.type === "end-room") {
        finalizePendingTranscript(room);
        registry.endRoom(roomId, "speaker-ended");
      }
    } catch {
      // ignore malformed control messages
    }
  });

  ws.on("close", () => {
    finalizePendingTranscript(room);
    room.sttSession?.end();
    room.sttSession = null;
    if (room.status !== "ended") registry.detachSpeaker(roomId);
  });
}

// Google may still be mid-utterance when the speaker disconnects/ends the room; without this,
// that trailing interim text would never be finalized and would just vanish for listeners.
function finalizePendingTranscript(room: Room): void {
  if (!room.currentInterim) return;
  const segment: TranscriptSegment = { ...room.currentInterim, isFinal: true, updatedAt: Date.now() };
  room.transcript.push(segment);
  room.currentInterim = null;
  broadcastToListeners(room, {
    type: "transcript",
    segmentId: segment.id,
    text: segment.text,
    isFinal: true,
    updatedAt: segment.updatedAt,
  });
}

function startSttSession(room: Room, registry: RoomRegistry): SttSession {
  return new SttSession({
    onResult: (result) => applySttResult(room, result),
    onError: (err) => sendToSpeaker(room, { type: "stt-status", state: "error", message: err.message }),
    onEnd: () => {
      if (room.status === "ended" || !room.speaker) return;
      sendToSpeaker(room, { type: "stt-status", state: "reconnecting" });
      room.sttSession = startSttSession(room, registry);
    },
  });
}

function applySttResult(room: Room, result: SttResult): void {
  const now = Date.now();
  const segment: TranscriptSegment = room.currentInterim
    ? { ...room.currentInterim, text: result.text, isFinal: result.isFinal, updatedAt: now }
    : { id: randomUUID(), text: result.text, isFinal: result.isFinal, startedAt: now, updatedAt: now };

  if (result.isFinal) {
    room.transcript.push(segment);
    room.currentInterim = null;
  } else {
    room.currentInterim = segment;
  }

  broadcastToListeners(room, {
    type: "transcript",
    segmentId: segment.id,
    text: segment.text,
    isFinal: segment.isFinal,
    updatedAt: segment.updatedAt,
  });
}
