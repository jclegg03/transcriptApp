import { describe, expect, it, vi } from "vitest";
import { buildRoomWsUrl } from "./ws.config";

describe("buildRoomWsUrl", () => {
    it("builds a ws:// url for an http API_URL", () => {
        const url = buildRoomWsUrl({ role: "listener", roomId: "STUDY1" });
        expect(url.startsWith("ws://")).toBe(true);
    });

    it("builds a wss:// url for an https API_URL", async () => {
        vi.resetModules();
        vi.doMock("./api.config", () => ({ API_URL: "https://example.com" }));
        const { buildRoomWsUrl: buildRoomWsUrlHttps } = await import("./ws.config");
        const url = buildRoomWsUrlHttps({ role: "listener", roomId: "STUDY1" });
        expect(url.startsWith("wss://")).toBe(true);
        vi.doUnmock("./api.config");
        vi.resetModules();
    });

    it("includes role and roomId as query params", () => {
        const url = new URL(buildRoomWsUrl({ role: "listener", roomId: "STUDY1" }));
        expect(url.searchParams.get("role")).toBe("listener");
        expect(url.searchParams.get("roomId")).toBe("STUDY1");
    });

    it("includes the token for a speaker", () => {
        const url = new URL(
            buildRoomWsUrl({ role: "speaker", roomId: "STUDY1", token: "secret-token" })
        );
        expect(url.searchParams.get("token")).toBe("secret-token");
    });

    it("omits the token for a listener", () => {
        const url = new URL(buildRoomWsUrl({ role: "listener", roomId: "STUDY1" }));
        expect(url.searchParams.has("token")).toBe(false);
    });
});
