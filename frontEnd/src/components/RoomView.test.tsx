import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import RoomView from "./RoomView";
import type { RoomMembership } from "../types/RoomMembership";

const speakerMembership: RoomMembership = {
    roomId: "12345",
    name: "Testing Room",
    role: "SPEAKER",
};

const listenerMembership: RoomMembership = {
    roomId: "12345",
    name: "Testing Room",
    role: "LISTENER",
};

describe("RoomView", () => {
    it("displays the room name and room code", () => {
        render(
            <RoomView
                membership={speakerMembership}
                onLeave={vi.fn()}
            />
        );

        expect(
            screen.getByRole("heading", { name: "Testing Room", level: 1 })
        ).toBeInTheDocument();

        expect(
            screen.getByText("12345")
        ).toBeInTheDocument();
    });
    it("displays the correct role information for a speaker", () => {
        render(
            <RoomView
                membership={speakerMembership}
                onLeave={vi.fn()}
            />
        );

        expect(screen.getByText("Speaker")).toBeInTheDocument();
        expect(screen.getByText("Ready to speak")).toBeInTheDocument();
    });
    it("displays the correct role information for a listener", () => {
        render(
            <RoomView
                membership={listenerMembership}
                onLeave={vi.fn()}
            />
        );

        expect(screen.getByText("Listener")).toBeInTheDocument();
        expect(screen.getByText("Listening")).toBeInTheDocument();
    });

    it("displays a Leave Room button", () => {
        render(
            <RoomView
                membership={speakerMembership}
                onLeave={vi.fn()}
            />
        );

        expect(
            screen.getByRole("button", { name: "Leave Room" })
        ).toBeInTheDocument();
    });

    it("calls onLeave when Leave Room is clicked", async () => {
        const onLeave = vi.fn();
        const user = userEvent.setup();

        render(
            <RoomView
                membership={speakerMembership}
                onLeave={onLeave}
            />
        );

        await user.click(
            screen.getByRole("button", { name: "Leave Room" })
        );

        expect(onLeave).toHaveBeenCalled();
    });

});