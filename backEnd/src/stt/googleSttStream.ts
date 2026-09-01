import speech from "@google-cloud/speech";
import { Duplex } from "node:stream";
import { STT_CONFIG } from "./sttConfig.js";

let sharedClient: InstanceType<typeof speech.v1.SpeechClient> | undefined;

export interface DeferredStreamOptions {
  /** Resolves once it's safe to open the real stream; rejects if it never will be. */
  waitUntilReady: () => Promise<void>;
  /** Only called after waitUntilReady() resolves. */
  openRealStream: () => Duplex;
}

/**
 * Returns a Duplex immediately, buffering any writes until waitUntilReady() resolves and
 * the real stream is opened, then forwards writes/data/error/end both ways.
 *
 * This exists because Google's own streaming-call setup has an internal, unlisten-able
 * error path: opening a streamingRecognize() call before credentials are confirmed valid
 * can crash the whole process on an unhandled 'error' event deep in gax/grpc's channel
 * setup, even with an 'error' listener already attached to the stream it returns
 * (verified empirically — a *second*, independent credential-resolution attempt fails
 * and crashes separately from the one that reaches our listener). Never calling
 * openRealStream() until waitUntilReady() has already succeeded avoids that path
 * entirely; a waitUntilReady() rejection is surfaced as a normal 'error' event instead.
 */
export function createDeferredStream(opts: DeferredStreamOptions): Duplex {
  let real: Duplex | null = null;
  let ended = false;
  const pendingWrites: Buffer[] = [];

  const proxy = new Duplex({
    writableObjectMode: false,
    readableObjectMode: true,
    write(chunk: Buffer, _encoding, callback) {
      if (real) real.write(chunk);
      else pendingWrites.push(chunk);
      callback();
    },
    read() {
      // Data is pushed proactively once the real stream is wired up below.
    },
    final(callback) {
      ended = true;
      real?.end();
      callback();
    },
  });

  opts
    .waitUntilReady()
    .then(() => {
      if (ended) return;
      const stream = opts.openRealStream();
      real = stream;
      stream.on("data", (data) => proxy.push(data));
      stream.on("error", (err) => proxy.emit("error", err));
      stream.on("end", () => proxy.push(null));
      for (const chunk of pendingWrites) stream.write(chunk);
      pendingWrites.length = 0;
    })
    .catch((err: unknown) => {
      if (!ended) proxy.emit("error", err instanceof Error ? err : new Error(String(err)));
    });

  return proxy;
}

export function createGoogleSttStream(): Duplex {
  sharedClient ??= new speech.v1.SpeechClient();
  const client = sharedClient;
  return createDeferredStream({
    waitUntilReady: () => client.auth.getClient().then(() => undefined),
    openRealStream: () =>
      client.streamingRecognize({ config: STT_CONFIG, interimResults: true }) as unknown as Duplex,
  });
}
