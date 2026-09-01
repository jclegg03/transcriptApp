/** Converts a clamped [-1, 1] Float32 audio buffer into signed 16-bit little-endian PCM. */
export function float32ToInt16LE(input: Float32Array): ArrayBuffer {
    const output = new ArrayBuffer(input.length * 2);
    const view = new DataView(output);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return output;
}
