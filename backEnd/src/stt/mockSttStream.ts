import { Duplex } from "node:stream";

const WORD_BANK = [
  "the",
  "quick",
  "brown",
  "fox",
  "jumps",
  "over",
  "the",
  "lazy",
  "dog",
  "while",
  "testing",
  "the",
  "mock",
  "speech",
  "to",
  "text",
  "pipeline",
  "end",
  "to",
  "end",
];

// ~100ms of 16kHz/16-bit mono audio — lines up 1:1 with the frontend's per-chunk
// send cadence, so the fake "speech" advances one word per real chunk received.
const BYTES_PER_WORD = 3200;
const WORDS_PER_SEGMENT = 6;

function fakeResult(transcript: string, isFinal: boolean) {
  return { results: [{ isFinal, alternatives: [{ transcript }] }] };
}

/** A Duplex matching SttSession's expectations, driven purely by bytes written — no timers. */
export function createMockSttStream(): Duplex {
  let bytesReceived = 0;
  let wordsEmitted = 0;
  let pendingWords: string[] = [];

  const stream = new Duplex({
    writableObjectMode: false,
    readableObjectMode: true,
    write(chunk: Buffer, _encoding, callback) {
      bytesReceived += chunk.length;
      const targetWordCount = Math.floor(bytesReceived / BYTES_PER_WORD);
      while (wordsEmitted < targetWordCount) {
        pendingWords.push(WORD_BANK[wordsEmitted % WORD_BANK.length]);
        wordsEmitted += 1;
        const isFinal = pendingWords.length >= WORDS_PER_SEGMENT;
        stream.push(fakeResult(pendingWords.join(" "), isFinal));
        if (isFinal) pendingWords = [];
      }
      callback();
    },
    read() {
      // Results are pushed proactively from write(); nothing to do on pull.
    },
    final(callback) {
      // Mirrors the real pipeline's finalizePendingTranscript: don't drop a mock
      // utterance that was stopped mid-word.
      if (pendingWords.length > 0) {
        stream.push(fakeResult(pendingWords.join(" "), true));
        pendingWords = [];
      }
      callback();
    },
  });

  return stream;
}
