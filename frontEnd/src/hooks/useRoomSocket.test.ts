import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRoomSocket } from "./useRoomSocket";
import { FakeWebSocket, installFakeWebSocket } from "../test/fakeWebSocket";
import type { RoomMembership } from "../types/RoomMembership";

beforeEach(() => {
    installFakeWebSocket();
    sessionStorage.clear();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("useRoomSocket (listener)", () => {
    const membership: RoomMembership = { roomId: "STUDY1", name: "Study Group", role: "LISTENER" };

    it("connects without a token and reflects room-state", () => {
        const { result } = renderHook(() => useRoomSocket(membership));
        const ws = FakeWebSocket.latest();
        expect(new URL(ws.url).searchParams.get("token")).toBeNull();

        act(() => ws.emitOpen());
        expect(result.current.connectionStatus).toBe("open");

        act(() => ws.emitMessage({ type: "room-state", status: "live", listenerCount: 3 }));
        expect(result.current.roomStatus).toBe("live");
        expect(result.current.listenerCount).toBe(3);
    });

    it("upserts transcript segments by segmentId", () => {
        const { result } = renderHook(() => useRoomSocket(membership));
        const ws = FakeWebSocket.latest();
        act(() => ws.emitOpen());

        act(() =>
            ws.emitMessage({ type: "transcript", segmentId: "a", text: "Hel", isFinal: false, updatedAt: 1 })
        );
        expect(result.current.transcript).toEqual([
            { segmentId: "a", text: "Hel", isFinal: false, updatedAt: 1 },
        ]);

        act(() =>
            ws.emitMessage({ type: "transcript", segmentId: "a", text: "Hello", isFinal: true, updatedAt: 2 })
        );
        expect(result.current.transcript).toEqual([
            { segmentId: "a", text: "Hello", isFinal: true, updatedAt: 2 },
        ]);

        act(() =>
            ws.emitMessage({ type: "transcript", segmentId: "b", text: "World", isFinal: true, updatedAt: 3 })
        );
        expect(result.current.transcript).toHaveLength(2);
    });

    it("tracks speaker-left then room-ended", () => {
        const { result } = renderHook(() => useRoomSocket(membership));
        const ws = FakeWebSocket.latest();
        act(() => ws.emitOpen());

        act(() => ws.emitMessage({ type: "speaker-left" }));
        expect(result.current.roomStatus).toBe("speaker-reconnecting");

        act(() => ws.emitMessage({ type: "room-ended", reason: "speaker-timeout" }));
        expect(result.current.endReason).toBe("speaker-timeout");
    });

    it("closes the socket on unmount", () => {
        const { unmount } = renderHook(() => useRoomSocket(membership));
        const ws = FakeWebSocket.latest();
        act(() => ws.emitOpen());

        unmount();
        expect(ws.close).toHaveBeenCalled();
    });
});

describe("useRoomSocket (speaker)", () => {
    const membership: RoomMembership = { roomId: "STUDY1", name: "Study Group", role: "SPEAKER" };

    it("does not open a socket when the speaker token is missing", () => {
        const { result } = renderHook(() => useRoomSocket(membership));
        expect(FakeWebSocket.instances).toHaveLength(0);
        expect(result.current.connectionStatus).toBe("closed");
        expect(result.current.fatalError?.code).toBe("missing-token");
    });

    it("connects with the stored speaker token", () => {
        sessionStorage.setItem("speakerToken:STUDY1", "secret-token");
        renderHook(() => useRoomSocket(membership));
        const ws = FakeWebSocket.latest();
        expect(new URL(ws.url).searchParams.get("token")).toBe("secret-token");
    });

    it("sends end-room and marks endReason as speaker-ended on close", () => {
        sessionStorage.setItem("speakerToken:STUDY1", "secret-token");
        const { result } = renderHook(() => useRoomSocket(membership));
        const ws = FakeWebSocket.latest();
        act(() => ws.emitOpen());

        act(() => result.current.endRoom());
        expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: "end-room" }));

        act(() => ws.emitClose(1000));
        expect(result.current.endReason).toBe("speaker-ended");
    });
});
