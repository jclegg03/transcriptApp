import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useMicStream } from "./useMicStream";

describe("useMicStream", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("starts idle", () => {
        const { result } = renderHook(() => useMicStream(vi.fn()));
        expect(result.current.status).toBe("idle");
        expect(result.current.error).toBeNull();
    });

    it("reports unsupported when getUserMedia doesn't exist", async () => {
        vi.stubGlobal("navigator", { mediaDevices: undefined });
        const { result } = renderHook(() => useMicStream(vi.fn()));

        await act(async () => {
            await result.current.start();
        });

        expect(result.current.status).toBe("error");
        expect(result.current.error?.code).toBe("unsupported");
    });

    it("maps a permission-denied getUserMedia rejection to a friendly error", async () => {
        const getUserMedia = vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError"));
        vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });

        const { result } = renderHook(() => useMicStream(vi.fn()));

        await act(async () => {
            await result.current.start();
        });

        expect(result.current.status).toBe("error");
        expect(result.current.error?.code).toBe("permission-denied");
    });

    it("maps a not-found getUserMedia rejection to no-device", async () => {
        const getUserMedia = vi.fn().mockRejectedValue(new DOMException("none", "NotFoundError"));
        vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });

        const { result } = renderHook(() => useMicStream(vi.fn()));

        await act(async () => {
            await result.current.start();
        });

        expect(result.current.error?.code).toBe("no-device");
    });
});
