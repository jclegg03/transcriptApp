import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import RoomView from "./RoomView";
import type { RoomMembership } from "../types/RoomMembership";
import { useRoomSocket, type RoomSocketState } from "../hooks/useRoomSocket";
import { useMicStream, type MicStreamControls } from "../hooks/useMicStream";

vi.mock("../hooks/useRoomSocket", () => ({
    useRoomSocket: vi.fn(),
}));

vi.mock("../hooks/useMicStream", () => ({
    useMicStream: vi.fn(),
}));

const mockUseRoomSocket = vi.mocked(useRoomSocket);
const mockUseMicStream = vi.mocked(useMicStream);

function socketState(overrides: Partial<RoomSocketState> = {}): RoomSocketState {
    return {
        connectionStatus: "open",
        roomStatus: "live",
        listenerCount: 0,
        transcript: [],
        sttStatus: null,
        endReason: null,
        fatalError: null,
        endRoom: vi.fn(),
        sendAudioChunk: vi.fn(),
        ...overrides,
    };
}

function micState(overrides: Partial<MicStreamControls> = {}): MicStreamControls {
    return {
        status: "idle",
        error: null,
        start: vi.fn(),
        stop: vi.fn(),
        ...overrides,
    };
}

const listenerMembership: RoomMembership = { roomId: "STUDY1", name: "Study Group", role: "LISTENER" };
const speakerMembership: RoomMembership = { roomId: "STUDY1", name: "Study Group", role: "SPEAKER" };

beforeEach(() => {
    mockUseRoomSocket.mockReset();
    mockUseMicStream.mockReset();
    mockUseMicStream.mockReturnValue(micState());
});

describe("RoomView", () => {
    it("renders the live transcript for a listener", () => {
        mockUseRoomSocket.mockReturnValue(
            socketState({
                transcript: [{ segmentId: "a", text: "Hello there", isFinal: true, updatedAt: 1 }],
            })
        );

        render(<RoomView membership={listenerMembership} onLeave={vi.fn()} />);

        expect(screen.getByText("You are listening.")).toBeInTheDocument();
        expect(screen.getByText("Hello there")).toBeInTheDocument();
    });

    it("shows an End Room button for the speaker that calls endRoom", () => {
        const endRoom = vi.fn();
        mockUseRoomSocket.mockReturnValue(socketState({ endRoom }));

        render(<RoomView membership={speakerMembership} onLeave={vi.fn()} />);

        const endButton = screen.getByRole("button", { name: "End Room" });
        fireEvent.click(endButton);
        expect(endRoom).toHaveBeenCalled();
    });

    it("disables End Room while the connection is not open", () => {
        mockUseRoomSocket.mockReturnValue(socketState({ connectionStatus: "connecting" }));

        render(<RoomView membership={speakerMembership} onLeave={vi.fn()} />);

        expect(screen.getByRole("button", { name: "End Room" })).toBeDisabled();
    });

    it("shows a terminal panel when the room has ended", () => {
        const onLeave = vi.fn();
        mockUseRoomSocket.mockReturnValue(socketState({ endReason: "speaker-ended" }));

        render(<RoomView membership={listenerMembership} onLeave={onLeave} />);

        expect(screen.getByText("The speaker ended this room.")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Back to Rooms" }));
        expect(onLeave).toHaveBeenCalled();
    });

    it("calls onLeave when Leave Room is clicked", () => {
        const onLeave = vi.fn();
        mockUseRoomSocket.mockReturnValue(socketState());

        render(<RoomView membership={listenerMembership} onLeave={onLeave} />);

        fireEvent.click(screen.getByRole("button", { name: "Leave Room" }));
        expect(onLeave).toHaveBeenCalled();
    });

    it("shows a fatal error message when present", () => {
        mockUseRoomSocket.mockReturnValue(
            socketState({ fatalError: { code: "connection-closed", message: "Couldn't connect to the room." } })
        );

        render(<RoomView membership={listenerMembership} onLeave={vi.fn()} />);

        expect(screen.getByRole("alert")).toHaveTextContent("Couldn't connect to the room.");
    });

    it("Start Speaking calls the mic hook's start", () => {
        const start = vi.fn();
        mockUseRoomSocket.mockReturnValue(socketState());
        mockUseMicStream.mockReturnValue(micState({ start }));

        render(<RoomView membership={speakerMembership} onLeave={vi.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "Start Speaking" }));
        expect(start).toHaveBeenCalled();
    });

    it("shows Stop Speaking and calls stop while streaming", () => {
        const stop = vi.fn();
        mockUseRoomSocket.mockReturnValue(socketState());
        mockUseMicStream.mockReturnValue(micState({ status: "streaming", stop }));

        render(<RoomView membership={speakerMembership} onLeave={vi.fn()} />);

        const button = screen.getByRole("button", { name: "Stop Speaking" });
        fireEvent.click(button);
        expect(stop).toHaveBeenCalled();
    });

    it("disables Start Speaking when the room isn't live yet", () => {
        mockUseRoomSocket.mockReturnValue(socketState({ roomStatus: "created" }));

        render(<RoomView membership={speakerMembership} onLeave={vi.fn()} />);

        expect(screen.getByRole("button", { name: "Start Speaking" })).toBeDisabled();
    });

    it("shows a mic error message when present", () => {
        mockUseRoomSocket.mockReturnValue(socketState());
        mockUseMicStream.mockReturnValue(
            micState({ status: "error", error: { code: "permission-denied", message: "Microphone access was denied." } })
        );

        render(<RoomView membership={speakerMembership} onLeave={vi.fn()} />);

        expect(screen.getByRole("alert")).toHaveTextContent("Microphone access was denied.");
    });
});
