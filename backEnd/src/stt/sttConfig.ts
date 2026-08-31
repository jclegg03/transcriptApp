export const STT_CONFIG = {
  encoding: "LINEAR16" as const,
  sampleRateHertz: 16000,
  languageCode: "en-US",
  enableAutomaticPunctuation: true,
};

// Proactively restart before Google's ~5 minute hard cap on a single streaming call.
export const STT_STREAM_RESTART_MS = 4 * 60_000 + 30_000;
