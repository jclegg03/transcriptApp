import { describe, it, expect } from "vitest";
import { float32ToInt16LE } from "./pcm";

function readInt16LE(buffer: ArrayBuffer, index: number): number {
    return new DataView(buffer).getInt16(index * 2, true);
}

describe("float32ToInt16LE", () => {
    it("converts silence to zero", () => {
        const buffer = float32ToInt16LE(new Float32Array([0]));
        expect(readInt16LE(buffer, 0)).toBe(0);
    });

    it("converts full-scale positive to 32767 (not overflowing 32768)", () => {
        const buffer = float32ToInt16LE(new Float32Array([1]));
        expect(readInt16LE(buffer, 0)).toBe(32767);
    });

    it("converts full-scale negative to -32768", () => {
        const buffer = float32ToInt16LE(new Float32Array([-1]));
        expect(readInt16LE(buffer, 0)).toBe(-32768);
    });

    it("clamps out-of-range input", () => {
        const buffer = float32ToInt16LE(new Float32Array([2, -2]));
        expect(readInt16LE(buffer, 0)).toBe(32767);
        expect(readInt16LE(buffer, 1)).toBe(-32768);
    });

    it("produces a buffer twice the sample count in bytes", () => {
        const buffer = float32ToInt16LE(new Float32Array([0, 0.5, -0.5, 1]));
        expect(buffer.byteLength).toBe(8);
    });

    it("writes little-endian byte order", () => {
        const buffer = float32ToInt16LE(new Float32Array([1]));
        const bytes = new Uint8Array(buffer);
        // 32767 = 0x7FFF -> low byte 0xFF first, high byte 0x7F second, in little-endian.
        expect(bytes[0]).toBe(0xff);
        expect(bytes[1]).toBe(0x7f);
    });
});
