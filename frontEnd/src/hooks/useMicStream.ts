import { useCallback, useEffect, useRef, useState } from "react";

export type MicStreamStatus = "idle" | "starting" | "streaming" | "error";

export interface MicStreamError {
    code: "permission-denied" | "no-device" | "unsupported" | "unknown";
    message: string;
}

export interface MicStreamControls {
    status: MicStreamStatus;
    error: MicStreamError | null;
    start: () => Promise<void>;
    stop: () => void;
}

function describeError(err: unknown): MicStreamError {
    if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            return {
                code: "permission-denied",
                message: "Microphone access was denied. Allow microphone access in your browser settings and try again.",
            };
        }
        if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
            return { code: "no-device", message: "No microphone was found." };
        }
    }
    return { code: "unknown", message: "Couldn't access the microphone." };
}

/** Owns the getUserMedia -> AudioWorklet -> PCM chunk pipeline for the speaker's mic. */
export function useMicStream(onChunk: (chunk: ArrayBuffer) => void): MicStreamControls {
    const [status, setStatus] = useState<MicStreamStatus>("idle");
    const [error, setError] = useState<MicStreamError | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const onChunkRef = useRef(onChunk);
    useEffect(() => {
        onChunkRef.current = onChunk;
    });

    // Resource cleanup only — doesn't touch status/error, so it's safe to call from
    // start()'s catch block without clobbering the error it just reported.
    const teardown = useCallback(() => {
        workletNodeRef.current?.port.postMessage("flush");
        workletNodeRef.current?.disconnect();
        workletNodeRef.current = null;

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close();
        }
        audioContextRef.current = null;
    }, []);

    const stop = useCallback(() => {
        teardown();
        setStatus("idle");
    }, [teardown]);

    const start = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setError({ code: "unsupported", message: "This browser doesn't support microphone capture." });
            setStatus("error");
            return;
        }

        setStatus("starting");
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
            streamRef.current = stream;

            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            await audioContext.audioWorklet.addModule(new URL("../audio/pcmWorkletProcessor.js", import.meta.url));

            const source = audioContext.createMediaStreamSource(stream);
            const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
            workletNodeRef.current = workletNode;

            workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
                onChunkRef.current(event.data);
            };

            // Route through a silent gain node rather than leaving the worklet
            // unconnected to destination — keeps it actively processing across
            // engines, without producing audible mic feedback.
            const silentGain = audioContext.createGain();
            silentGain.gain.value = 0;
            source.connect(workletNode);
            workletNode.connect(silentGain);
            silentGain.connect(audioContext.destination);

            setStatus("streaming");
        } catch (err) {
            teardown();
            setError(describeError(err));
            setStatus("error");
        }
    }, [teardown]);

    useEffect(() => teardown, [teardown]);

    return { status, error, start, stop };
}
