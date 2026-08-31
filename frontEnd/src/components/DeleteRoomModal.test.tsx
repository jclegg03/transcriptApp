import { render, screen, fireEvent } from "@testing-library/react"; 
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import DeleteRoomModal from "./DeleteRoomModal"; 
import DisplayRooms from "./DisplayRooms";
import { initialRooms } from "../utils/initialRoomsList";
import type { RoomType } from "../types/RoomType";

describe("DeleteRoomModal", () => {
    it("displays the name of the room being deleted", () => {
        const roomToDelete: RoomType = initialRooms[0];

        render(
            <DeleteRoomModal
                roomToDelete={roomToDelete}
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(
            screen.getByText(`Are you sure you want to delete "${roomToDelete.name}"?`)
        ).toBeInTheDocument();
    });
    it("displays Delete Room and Cancel buttons", () => {
        const roomToDelete: RoomType = initialRooms[0];

        render(
            <DeleteRoomModal
                roomToDelete={roomToDelete}
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(
            screen.getByRole("button", { name: "Delete Room" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Cancel" })
        ).toBeInTheDocument();
    }); 
    it("calls onConfirm when Delete Room is clicked", () => {
        const roomToDelete: RoomType = initialRooms[0];
        const onConfirm = vi.fn();

        render(
            <DeleteRoomModal
                roomToDelete={roomToDelete}
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Delete Room" })
        );

        expect(onConfirm).toHaveBeenCalled();
    });
    it("calls onCancel when Cancel is clicked", () => {
        const roomToDelete: RoomType = initialRooms[0];
        const onCancel = vi.fn();

        render(
            <DeleteRoomModal
                roomToDelete={roomToDelete}
                onConfirm={vi.fn()}
                onCancel={onCancel}
            />
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Cancel" })
        );

        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});