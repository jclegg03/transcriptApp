import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import DisplayRooms from "./DisplayRooms";
import type { RoomType } from "../types/RoomType";

const sampleRooms: RoomType[] = [
    {
        roomId: "STUDY1",
        name: "Study Group",
        status: "live",
        hasSpeaker: true,
        listenerCount: 2,
        createdAt: Date.now(),
    },
    {
        roomId: "BOOK1",
        name: "Book Club",
        status: "created",
        hasSpeaker: true,
        listenerCount: 1,
        createdAt: Date.now(),
    },
    {
        roomId: "PROJ1",
        name: "Project Meeting",
        status: "live",
        hasSpeaker: true,
        listenerCount: 3,
        createdAt: Date.now(),
    },
];

describe("DisplayRooms", () => {
    it("displays nothing if there are no rooms", () => {
        render(
            <DisplayRooms rooms={[]} onJoinRoom={vi.fn()} onDeleteRoom={vi.fn()} />
        );
        expect(screen.getByText("No rooms. Create one to get started.")).toBeInTheDocument();
    });
    it("displays all three task names", () => {
        render(
            <DisplayRooms rooms={sampleRooms} onJoinRoom={vi.fn()} onDeleteRoom={vi.fn()} />
        );
        expect(screen.getByText("Study Group")).toBeInTheDocument();
        expect(screen.getByText("Book Club")).toBeInTheDocument();
        expect(screen.getByText("Project Meeting")).toBeInTheDocument();
    });
    it("displays all three active/inactive status texts", () => {
        render(
            <DisplayRooms rooms={sampleRooms} onJoinRoom={vi.fn()} onDeleteRoom={vi.fn()} />
        );
        expect(screen.getAllByText("Active")).toHaveLength(2);
        expect(screen.getAllByText("Inactive")).toHaveLength(1);
    });
    it("displays the correct number of people inside the room", () => {
        render(
            <DisplayRooms rooms={sampleRooms} onJoinRoom={vi.fn()} onDeleteRoom={vi.fn()} />
        );
        expect(screen.getByText("3 people")).toBeInTheDocument();
        expect(screen.getByText("2 people")).toBeInTheDocument();
        expect(screen.getByText("4 people")).toBeInTheDocument();
    });
    it("displays 0 people if there is no one in the room", () => {
        const emptyRoom: RoomType = {
            roomId: "EMPTY1",
            name: "Study Group",
            status: "created",
            hasSpeaker: false,
            listenerCount: 0,
            createdAt: Date.now(),
        };
        render(
            <DisplayRooms rooms={[emptyRoom]} onJoinRoom={vi.fn()} onDeleteRoom={vi.fn()} />
        );
        expect(screen.getByText("0 people")).toBeInTheDocument();
        expect(screen.getByText("Inactive")).toBeInTheDocument(); //it should be inactive if there are no people inside.
    });
})
