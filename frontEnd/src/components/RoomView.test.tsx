import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import RoomView from "./RoomView";
import type { RoomMembership } from "../types/RoomMembership";
import { useRoomSocket, type RoomSocketState } from "../hooks/useRoomSocket";

vi.mock("../hooks/useRoomSocket", () => ({
    useRoomSocket: vi.fn(),
}));

const mockUseRoomSocket = vi.mocked(useRoomSocket);

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
        ...overrides,
    };
}

const listenerMembership: RoomMembership = { roomId: "STUDY1", name: "Study Group", role: "LISTENER" };
const speakerMembership: RoomMembership = { roomId: "STUDY1", name: "Study Group", role: "SPEAKER" };

beforeEach(() => {
    mockUseRoomSocket.mockReset();
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
});
