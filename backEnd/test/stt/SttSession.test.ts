import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PassThrough } from "node:stream";
import { SttSession } from "../../src/stt/SttSession.js";
import { STT_STREAM_RESTART_MS } from "../../src/stt/sttConfig.js";

function fakeGoogleResult(transcript: string, isFinal: boolean) {
  return { results: [{ isFinal, alternatives: [{ transcript }] }] };
}

describe("SttSession", () => {
  let streams: PassThrough[];

  beforeEach(() => {
    vi.useFakeTimers();
    streams = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function makeFactory() {
    return vi.fn(() => {
      const stream = new PassThrough({ objectMode: true });
      streams.push(stream);
      return stream as any;
    });
  }

  it("forwards interim and final results via onResult", () => {
    const onResult = vi.fn();
    const factory = makeFactory();
    new SttSession({ onResult, onError: vi.fn(), onEnd: vi.fn() }, factory);

    streams[0].emit("data", fakeGoogleResult("hello wor", false));
    streams[0].emit("data", fakeGoogleResult("hello world", true));

    expect(onResult).toHaveBeenNthCalledWith(1, { text: "hello wor", isFinal: false });
    expect(onResult).toHaveBeenNthCalledWith(2, { text: "hello world", isFinal: true });
  });

  it("calls onError when the underlying stream errors", () => {
    const onError = vi.fn();
    const factory = makeFactory();
    new SttSession({ onResult: vi.fn(), onError, onEnd: vi.fn() }, factory);

    const err = new Error("boom");
    streams[0].emit("error", err);

    expect(onError).toHaveBeenCalledWith(err);
  });

  it("calls onEnd when the stream ends unexpectedly", () => {
    const onEnd = vi.fn();
    const factory = makeFactory();
    new SttSession({ onResult: vi.fn(), onError: vi.fn(), onEnd }, factory);

    streams[0].emit("end");

    expect(onEnd).toHaveBeenCalled();
  });

  it("proactively opens a new stream before Google's hard duration cap", () => {
    const factory = makeFactory();
    new SttSession({ onResult: vi.fn(), onError: vi.fn(), onEnd: vi.fn() }, factory);

    expect(factory).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(STT_STREAM_RESTART_MS + 1);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("does not call onEnd for its own proactive restart", () => {
    const onEnd = vi.fn();
    const factory = makeFactory();
    new SttSession({ onResult: vi.fn(), onError: vi.fn(), onEnd }, factory);

    vi.advanceTimersByTime(STT_STREAM_RESTART_MS + 1);

    expect(onEnd).not.toHaveBeenCalled();
  });

  it("stops forwarding events after end() is called", () => {
    const onResult = vi.fn();
    const factory = makeFactory();
    const session = new SttSession({ onResult, onError: vi.fn(), onEnd: vi.fn() }, factory);

    session.end();
    streams[0].emit("data", fakeGoogleResult("late", true));

    expect(onResult).not.toHaveBeenCalled();
  });

  it("writes buffers into the active stream", () => {
    const factory = makeFactory();
    const session = new SttSession({ onResult: vi.fn(), onError: vi.fn(), onEnd: vi.fn() }, factory);
    const writeSpy = vi.spyOn(streams[0], "write");

    const chunk = Buffer.from([1, 2, 3]);
    session.write(chunk);

    expect(writeSpy).toHaveBeenCalledWith(chunk);
  });
});
