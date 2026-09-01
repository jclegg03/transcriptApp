import { vi } from "vitest";

/** Minimal fake of the browser WebSocket API, driven manually in tests. */
export class FakeWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    static instances: FakeWebSocket[] = [];

    readonly url: string;
    readyState = FakeWebSocket.CONNECTING;
    send = vi.fn();
    close = vi.fn(() => {
        this.readyState = FakeWebSocket.CLOSED;
    });

    onopen: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onclose: ((event: { code: number; reason: string }) => void) | null = null;

    constructor(url: string) {
        this.url = url;
        FakeWebSocket.instances.push(this);
    }

    emitOpen(): void {
        this.readyState = FakeWebSocket.OPEN;
        this.onopen?.();
    }

    emitMessage(data: unknown): void {
        this.onmessage?.({ data: JSON.stringify(data) });
    }

    emitClose(code = 1000, reason = ""): void {
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.({ code, reason });
    }

    static reset(): void {
        FakeWebSocket.instances = [];
    }

    static latest(): FakeWebSocket {
        const ws = FakeWebSocket.instances.at(-1);
        if (!ws) throw new Error("No FakeWebSocket instance was constructed");
        return ws;
    }
}

export function installFakeWebSocket(): void {
    FakeWebSocket.reset();
    vi.stubGlobal("WebSocket", FakeWebSocket);
}
