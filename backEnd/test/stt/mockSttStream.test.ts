import { describe, it, expect } from "vitest";
import { createMockSttStream } from "../../src/stt/mockSttStream.js";

const BYTES_PER_WORD = 3200;

function collectResults(stream: ReturnType<typeof createMockSttStream>) {
  const events: { text: string; isFinal: boolean }[] = [];
  stream.on("data", (data: any) => {
    const result = data.results[0];
    events.push({ text: result.alternatives[0].transcript, isFinal: result.isFinal });
  });
  return events;
}

// Duplex read-side emission happens via process.nextTick, not synchronously within write().
function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe("createMockSttStream", () => {
  it("emits one interim word per BYTES_PER_WORD chunk, finalizing every 6th word", async () => {
    const stream = createMockSttStream();
    const events = collectResults(stream);

    for (let i = 0; i < 6; i++) {
      stream.write(Buffer.alloc(BYTES_PER_WORD));
    }
    await flush();

    expect(events).toHaveLength(6);
    expect(events.slice(0, 5).every((e) => e.isFinal === false)).toBe(true);
    expect(events[5].isFinal).toBe(true);
    expect(events[5].text).toBe("the quick brown fox jumps over");
    expect(events[0].text).toBe("the");
  });

  it("starts a fresh segment after finalizing", async () => {
    const stream = createMockSttStream();
    const events = collectResults(stream);

    for (let i = 0; i < 7; i++) {
      stream.write(Buffer.alloc(BYTES_PER_WORD));
    }
    await flush();

    expect(events).toHaveLength(7);
    expect(events[5].isFinal).toBe(true);
    expect(events[6].isFinal).toBe(false);
    expect(events[6].text).toBe("the");
  });

  it("only emits once enough bytes have accumulated", async () => {
    const stream = createMockSttStream();
    const events = collectResults(stream);

    stream.write(Buffer.alloc(BYTES_PER_WORD - 1));
    await flush();
    expect(events).toHaveLength(0);

    stream.write(Buffer.alloc(1));
    await flush();
    expect(events).toHaveLength(1);
  });

  it("flushes a trailing partial segment on end()", async () => {
    const stream = createMockSttStream();
    const events = collectResults(stream);

    for (let i = 0; i < 2; i++) {
      stream.write(Buffer.alloc(BYTES_PER_WORD));
    }
    await flush();
    expect(events).toHaveLength(2);

    await new Promise<void>((resolve) => {
      stream.on("finish", resolve);
      stream.end();
    });
    await flush();

    expect(events).toHaveLength(3);
    expect(events[2].isFinal).toBe(true);
    expect(events[2].text).toBe("the quick");
  });
});
