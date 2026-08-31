import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RoomRegistry, RECONNECT_WINDOW_MS } from "../../src/rooms/RoomRegistry.js";
import type { WebSocket } from "ws";

function fakeSocket(): WebSocket {
  return { readyState: 1, OPEN: 1, send: vi.fn(), close: vi.fn() } as unknown as WebSocket;
}

describe("RoomRegistry", () => {
  let registry: RoomRegistry;

  beforeEach(() => {
    vi.useFakeTimers();
    registry = new RoomRegistry();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a room in 'created' status with a unique id and speaker token", () => {
    const room = registry.createRoom();
    expect(room.status).toBe("created");
    expect(room.id).toMatch(/^[A-Z2-9]{6}$/);
    expect(room.speakerToken).toBeTruthy();
    expect(registry.getRoom(room.id)).toBe(room);
  });

  it("attaches a speaker with the correct token and moves the room to 'live'", () => {
    const room = registry.createRoom();
    const result = registry.attachSpeaker(room.id, room.speakerToken, fakeSocket());
    expect(result.ok).toBe(true);
    expect(room.status).toBe("live");
    expect(room.speaker).not.toBeNull();
  });

  it("rejects attachSpeaker with a bad token", () => {
    const room = registry.createRoom();
    const result = registry.attachSpeaker(room.id, "wrong-token", fakeSocket());
    expect(result).toEqual({ ok: false, reason: "bad-token" });
    expect(room.speaker).toBeNull();
  });

  it("rejects a second speaker while one is already connected", () => {
    const room = registry.createRoom();
    registry.attachSpeaker(room.id, room.speakerToken, fakeSocket());
    const second = registry.attachSpeaker(room.id, room.speakerToken, fakeSocket());
    expect(second).toEqual({ ok: false, reason: "already-connected" });
  });

  it("rejects attachSpeaker for an unknown room", () => {
    const result = registry.attachSpeaker("NOPE99", "token", fakeSocket());
    expect(result).toEqual({ ok: false, reason: "not-found" });
  });

  it("allows reconnect within the grace window and keeps the room alive", () => {
    const room = registry.createRoom();
    registry.attachSpeaker(room.id, room.speakerToken, fakeSocket());

    registry.detachSpeaker(room.id);
    expect(room.status).toBe("speaker-reconnecting");

    vi.advanceTimersByTime(RECONNECT_WINDOW_MS / 2);
    const reattach = registry.attachSpeaker(room.id, room.speakerToken, fakeSocket());
    expect(reattach.ok).toBe(true);
    expect(room.status).toBe("live");

    vi.advanceTimersByTime(RECONNECT_WINDOW_MS + 1000);
    expect(room.status).toBe("live"); // the stale timeout must not fire after reconnect
  });

  it("ends the room if the speaker does not reconnect within the grace window", () => {
    const room = registry.createRoom();
    registry.attachSpeaker(room.id, room.speakerToken, fakeSocket());

    registry.detachSpeaker(room.id);
    vi.advanceTimersByTime(RECONNECT_WINDOW_MS + 1);

    expect(room.status).toBe("ended");
  });

  it("emits room-ended with 'speaker-timeout' when the grace window expires", () => {
    const room = registry.createRoom();
    registry.attachSpeaker(room.id, room.speakerToken, fakeSocket());
    registry.detachSpeaker(room.id);

    const onEnded = vi.fn();
    registry.on("room-ended", onEnded);
    vi.advanceTimersByTime(RECONNECT_WINDOW_MS + 1);

    expect(onEnded).toHaveBeenCalledWith(room, "speaker-timeout");
  });

  it("tracks listener add/remove and fires listener-added/listener-removed events", () => {
    const room = registry.createRoom();
    const onAdded = vi.fn();
    const onRemoved = vi.fn();
    registry.on("listener-added", onAdded);
    registry.on("listener-removed", onRemoved);

    const listener = registry.addListenerConnection(room.id, fakeSocket());
    expect(listener).toBeDefined();
    expect(room.listeners.size).toBe(1);
    expect(onAdded).toHaveBeenCalled();

    registry.removeListenerConnection(room.id, listener!.id);
    expect(room.listeners.size).toBe(0);
    expect(onRemoved).toHaveBeenCalled();
  });

  it("does not allow attaching a speaker to an ended room", () => {
    const room = registry.createRoom();
    registry.attachSpeaker(room.id, room.speakerToken, fakeSocket());
    registry.endRoom(room.id, "speaker-ended");

    const result = registry.attachSpeaker(room.id, room.speakerToken, fakeSocket());
    expect(result).toEqual({ ok: false, reason: "not-found" });
  });

  it("counts only non-ended rooms as active", () => {
    const a = registry.createRoom();
    const b = registry.createRoom();
    expect(registry.activeRoomCount()).toBe(2);

    registry.endRoom(a.id, "speaker-ended");
    expect(registry.activeRoomCount()).toBe(1);
    expect(registry.listActiveRoomIds()).toEqual([b.id]);
  });
});
