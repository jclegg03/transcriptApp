import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import { describe, expect, it, vi } from "vitest";

import CreateRoomModal from "./CreateRoomModal";

describe("CreateRoomModal", () => {
    it("renders the modal", () => {
        render(
            <CreateRoomModal
                onAddRoom={vi.fn()}
                onCloseAddRoom={vi.fn()}
            />
        );
        expect(screen.getByRole("heading", { name: "Create Room" })).toBeInTheDocument();
        expect(
            screen.getByText(/Please enter a room name/i)
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Add Room" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Cancel" })
        ).toBeInTheDocument();
    });
    it("displays the creation date", () => {
        render(
            <CreateRoomModal
                onAddRoom={vi.fn()}
                onCloseAddRoom={vi.fn()}
            />
        );
        const today = new Date().toLocaleDateString();
        expect(
            screen.getByText(`Creation Date: ${today}`)
        ).toBeInTheDocument();
    });
    it("allows the user to enter a room name", async () => {
        const user = userEvent.setup();
        render(
            <CreateRoomModal
                onAddRoom={vi.fn()}
                onCloseAddRoom={vi.fn()}
            />
        );
        const input = screen.getByPlaceholderText("Enter name...");
        await user.type(input, "Study Group");
        expect(input).toHaveValue("Study Group");
    });
    it("calls onAddRoom with the room name when the form is submitted", async () => {
        const user = userEvent.setup();
        const onAddRoom = vi.fn();
        render(
            <CreateRoomModal
                onAddRoom={onAddRoom}
                onCloseAddRoom={vi.fn()}
            />
        );
        const input = screen.getByPlaceholderText("Enter name...");
        await user.type(input, "Study Group");
        await user.click(screen.getByRole("button", { name: "Add Room" }));
        expect(onAddRoom).toHaveBeenCalledWith("Study Group");
    });
    it("calls onCloseAddRoom when Cancel is clicked", async () => {
        const user = userEvent.setup();
        const onCloseAddRoom = vi.fn();
        render(
            <CreateRoomModal
                onAddRoom={vi.fn()}
                onCloseAddRoom={onCloseAddRoom}
            />
        );
        await user.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onCloseAddRoom).toHaveBeenCalled();
    });
});