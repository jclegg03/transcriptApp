// Runs in AudioWorkletGlobalScope, loaded via a raw URL (see useMicStream.ts) rather than
// as a bundled module — no imports/exports, and no access to ../audio/pcm.ts's tested
// float32ToInt16LE, so the same conversion is duplicated inline below. Keep them in sync.

const BATCH_SAMPLES = 1600; // 100ms @ 16kHz mono

class PcmProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._buffer = new Float32Array(BATCH_SAMPLES);
        this._offset = 0;
        this.port.onmessage = (event) => {
            if (event.data === "flush") this._flush();
        };
    }

    process(inputs) {
        const input = inputs[0] && inputs[0][0];
        if (input) {
            for (let i = 0; i < input.length; i++) {
                this._buffer[this._offset++] = input[i];
                if (this._offset === BATCH_SAMPLES) this._flush();
            }
        }
        return true;
    }

    _flush() {
        if (this._offset === 0) return;
        const int16 = new Int16Array(this._offset);
        for (let i = 0; i < this._offset; i++) {
            const s = Math.max(-1, Math.min(1, this._buffer[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        this.port.postMessage(int16.buffer, [int16.buffer]);
        this._offset = 0;
    }
}

registerProcessor("pcm-processor", PcmProcessor);
