import { useCallback, useEffect, useRef, useState } from "react";
import type { ListenerServerMessage, SpeakerClientMessage, SpeakerServerMessage } from "shared/api/ws";
import type { RoomMembership } from "../types/RoomMembership";
import type { TranscriptSegmentState } from "../types/TranscriptSegment";
import { buildRoomWsUrl } from "../api/ws.config";

export type ConnectionStatus = "connecting" | "open" | "closed";
export type RoomLiveStatus = "created" | "live" | "speaker-reconnecting";
export type EndReason = "speaker-ended" | "speaker-timeout" | "server-shutdown";

interface FatalError {
  code: string;
  message: string;
}

export interface RoomSocketState {
  connectionStatus: ConnectionStatus;
  roomStatus: RoomLiveStatus | null;
  listenerCount: number;
  transcript: TranscriptSegmentState[];
  sttStatus: { state: "connected" | "reconnecting" | "error"; message?: string } | null;
  endReason: EndReason | null;
  fatalError: FatalError | null;
  endRoom: () => void;
  sendAudioChunk: (chunk: ArrayBuffer) => void;
}

export function useRoomSocket(membership: RoomMembership): RoomSocketState {
  const { roomId, role } = membership;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [roomStatus, setRoomStatus] = useState<RoomLiveStatus | null>(null);
  const [listenerCount, setListenerCount] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptSegmentState[]>([]);
  const [sttStatus, setSttStatus] = useState<RoomSocketState["sttStatus"]>(null);
  const [endReason, setEndReason] = useState<EndReason | null>(null);
  const [fatalError, setFatalError] = useState<FatalError | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const endRequestedRef = useRef(false);
  const hasOpenedRef = useRef(false);

  // Read synchronously during render rather than as a setState-in-effect: whether the
  // speaker token is present is fully determined by roomId/role, no async work needed.
  const speakerToken = role === "SPEAKER" ? sessionStorage.getItem(`speakerToken:${roomId}`) : null;
  const missingSpeakerToken = role === "SPEAKER" && !speakerToken;

  // RoomView is mounted fresh for each room join (App.tsx only ever sets a new
  // `membership` after the previous one becomes null), so this effect's deps are
  // expected to be stable for the hook's whole lifetime — the initial useState
  // values above already represent "just starting to connect."
  useEffect(() => {
    if (missingSpeakerToken) return;
    endRequestedRef.current = false;
    hasOpenedRef.current = false;
    // True once *this* effect run's own cleanup has torn the socket down (e.g. React
    // StrictMode's dev-only double-invoke, or a deps change) — its close is expected,
    // not a dropped connection, so the resulting onclose should be a no-op.
    let tornDownByCleanup = false;

    const url =
      role === "SPEAKER"
        ? buildRoomWsUrl({ role: "speaker", roomId, token: speakerToken as string })
        : buildRoomWsUrl({ role: "listener", roomId });

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      hasOpenedRef.current = true;
      setConnectionStatus("open");
    };

    ws.onmessage = (event) => {
      let msg: SpeakerServerMessage | ListenerServerMessage;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      switch (msg.type) {
        case "ready":
          setRoomStatus("live");
          break;
        case "listener-count":
          setListenerCount(msg.count);
          break;
        case "stt-status":
          setSttStatus({ state: msg.state, message: msg.message });
          break;
        case "room-state":
          setRoomStatus(msg.status);
          setListenerCount(msg.listenerCount);
          break;
        case "transcript":
          setTranscript((prev) => {
            const next: TranscriptSegmentState = {
              segmentId: msg.segmentId,
              text: msg.text,
              isFinal: msg.isFinal,
              updatedAt: msg.updatedAt,
            };
            const index = prev.findIndex((segment) => segment.segmentId === next.segmentId);
            if (index === -1) return [...prev, next];
            const copy = [...prev];
            copy[index] = next;
            return copy;
          });
          break;
        case "speaker-joined":
          setRoomStatus("live");
          break;
        case "speaker-left":
          setRoomStatus("speaker-reconnecting");
          break;
        case "room-ended":
          setEndReason(msg.reason);
          break;
        case "error":
          setFatalError({ code: msg.code, message: msg.message });
          break;
      }
    };

    ws.onclose = (event) => {
      if (tornDownByCleanup) return;
      setConnectionStatus("closed");
      wsRef.current = null;

      if (role === "SPEAKER" && endRequestedRef.current) {
        setEndReason((prev) => prev ?? "speaker-ended");
        return;
      }

      if (event.code !== 1000) {
        setFatalError(
          (prev) =>
            prev ?? {
              code: "connection-closed",
              message: hasOpenedRef.current
                ? "Connection to the room was lost."
                : "Couldn't connect to the room.",
            }
        );
      }
    };

    return () => {
      tornDownByCleanup = true;
      wsRef.current = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [roomId, role, missingSpeakerToken, speakerToken]);

  const endRoom = useCallback(() => {
    const ws = wsRef.current;
    if (role !== "SPEAKER" || !ws || ws.readyState !== WebSocket.OPEN) return;
    endRequestedRef.current = true;
    const message: SpeakerClientMessage = { type: "end-room" };
    ws.send(JSON.stringify(message));
  }, [role]);

  const sendAudioChunk = useCallback(
    (chunk: ArrayBuffer) => {
      const ws = wsRef.current;
      if (role !== "SPEAKER" || !ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(chunk);
    },
    [role]
  );

  if (missingSpeakerToken) {
    return {
      connectionStatus: "closed",
      roomStatus: null,
      listenerCount: 0,
      transcript: [],
      sttStatus: null,
      endReason: null,
      fatalError: { code: "missing-token", message: "Missing speaker credentials for this room." },
      endRoom,
      sendAudioChunk,
    };
  }

  return {
    connectionStatus,
    roomStatus,
    listenerCount,
    transcript,
    sttStatus,
    endReason,
    fatalError,
    endRoom,
    sendAudioChunk,
  };
}
