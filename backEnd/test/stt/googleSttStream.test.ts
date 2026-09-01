import { describe, it, expect, vi } from "vitest";
import { PassThrough } from "node:stream";
import { createDeferredStream } from "../../src/stt/googleSttStream.js";

function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe("createDeferredStream", () => {
  it("buffers writes until waitUntilReady resolves, then forwards them to the real stream", async () => {
    const real = new PassThrough({ objectMode: true });
    const writeSpy = vi.spyOn(real, "write");
    let resolveReady: () => void;
    const ready = new Promise<void>((resolve) => (resolveReady = resolve));

    const stream = createDeferredStream({
      waitUntilReady: () => ready,
      openRealStream: () => real as any,
    });

    const chunk = Buffer.from([1, 2, 3]);
    stream.write(chunk);
    expect(writeSpy).not.toHaveBeenCalled();

    resolveReady!();
    await flush();

    expect(writeSpy).toHaveBeenCalledWith(chunk);
  });

  it("forwards data events from the real stream once opened", async () => {
    const real = new PassThrough({ objectMode: true });
    const onData = vi.fn();

    const stream = createDeferredStream({
      waitUntilReady: () => Promise.resolve(),
      openRealStream: () => real as any,
    });
    stream.on("data", onData);
    await flush();

    real.emit("data", { results: [{ isFinal: true, alternatives: [{ transcript: "hi" }] }] });
    await flush();

    expect(onData).toHaveBeenCalledWith({ results: [{ isFinal: true, alternatives: [{ transcript: "hi" }] }] });
  });

  it("emits error and never calls openRealStream when waitUntilReady rejects", async () => {
    const openRealStream = vi.fn();
    const onError = vi.fn();
    const err = new Error("no credentials");

    const stream = createDeferredStream({
      waitUntilReady: () => Promise.reject(err),
      openRealStream,
    });
    stream.on("error", onError);
    await flush();

    expect(onError).toHaveBeenCalledWith(err);
    expect(openRealStream).not.toHaveBeenCalled();
  });

  it("forwards error events from the real stream", async () => {
    const real = new PassThrough({ objectMode: true });
    const onError = vi.fn();
    const err = new Error("stream broke");

    const stream = createDeferredStream({
      waitUntilReady: () => Promise.resolve(),
      openRealStream: () => real as any,
    });
    stream.on("error", onError);
    await flush();

    real.emit("error", err);
    expect(onError).toHaveBeenCalledWith(err);
  });

  it("does not open the real stream if end() was already called before waitUntilReady resolves", async () => {
    const openRealStream = vi.fn();
    let resolveReady: () => void;
    const ready = new Promise<void>((resolve) => (resolveReady = resolve));

    const stream = createDeferredStream({ waitUntilReady: () => ready, openRealStream });
    stream.end();

    resolveReady!();
    await flush();

    expect(openRealStream).not.toHaveBeenCalled();
  });
});
