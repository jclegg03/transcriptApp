import speech from "@google-cloud/speech";
import type { Duplex } from "node:stream";
import { STT_CONFIG, STT_STREAM_RESTART_MS } from "./sttConfig.js";

export interface SttResult {
  text: string;
  isFinal: boolean;
}

export interface SttSessionOptions {
  onResult: (result: SttResult) => void;
  onError: (err: Error) => void;
  /** Called when the stream ends unexpectedly (not our own proactive restart). */
  onEnd: () => void;
}

/** Opens one Google streamingRecognize call. Overridable so tests can inject a fake stream. */
export type StreamFactory = () => Duplex;

let sharedClient: InstanceType<typeof speech.v1.SpeechClient> | undefined;

function defaultStreamFactory(): Duplex {
  sharedClient ??= new speech.v1.SpeechClient();
  return sharedClient.streamingRecognize({
    config: STT_CONFIG,
    interimResults: true,
  }) as unknown as Duplex;
}

export class SttSession {
  private stream: Duplex;
  private restartTimer: NodeJS.Timeout;
  private ended = false;

  constructor(
    private readonly opts: SttSessionOptions,
    private readonly createStream: StreamFactory = defaultStreamFactory
  ) {
    this.stream = this.openStream();
    this.restartTimer = setTimeout(() => this.restart(), STT_STREAM_RESTART_MS);
  }

  write(chunk: Buffer): void {
    if (!this.ended && !this.stream.destroyed) {
      this.stream.write(chunk);
    }
  }

  end(): void {
    this.ended = true;
    clearTimeout(this.restartTimer);
    this.stream.removeAllListeners();
    this.stream.end();
  }

  private openStream(): Duplex {
    const stream = this.createStream();
    stream.on("data", (data: any) => {
      const result = data.results?.[0];
      const transcript = result?.alternatives?.[0]?.transcript;
      if (!result || typeof transcript !== "string") return;
      this.opts.onResult({ text: transcript, isFinal: Boolean(result.isFinal) });
    });
    stream.on("error", (err: Error) => {
      if (!this.ended) this.opts.onError(err);
    });
    stream.on("end", () => {
      if (!this.ended) this.opts.onEnd();
    });
    return stream;
  }

  /** Swap to a new Google stream before the ~5 minute hard limit is hit. */
  private restart(): void {
    const oldStream = this.stream;
    oldStream.removeAllListeners();
    oldStream.end();

    this.stream = this.openStream();
    this.restartTimer = setTimeout(() => this.restart(), STT_STREAM_RESTART_MS);
  }
}
