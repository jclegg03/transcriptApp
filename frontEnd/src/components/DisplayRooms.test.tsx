import { render, screen, fireEvent } from "@testing-library/react"; 
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import DisplayRooms from "./DisplayRooms"; 
import { initialRooms } from "../utils/initialRoomsList";
import type { RoomType } from "../types/RoomType";


describe("DisplayRooms", () => {
    it("displays nothing if there are no rooms", () => {
        render(
            <DisplayRooms rooms={[]} />
        ); 
        expect(screen.getByText("No rooms. Create one to get started.")).toBeInTheDocument();
    }); 
    it("displays all three task names", () => {
        render(
            <DisplayRooms rooms={initialRooms} />
        );
        expect(screen.getByText("Study Group")).toBeInTheDocument();
        expect(screen.getByText("Book Club")).toBeInTheDocument();
        expect(screen.getByText("Project Meeting")).toBeInTheDocument();
    });
    it("displays all three active/inactive status texts", () => {
        render(
            <DisplayRooms rooms={initialRooms} />
        );
        expect(screen.getAllByText("Active")).toHaveLength(2);
        expect(screen.getAllByText("Inactive")).toHaveLength(1);
    });
    it("displays the correct number of people inside the room", () => {
        render(
            <DisplayRooms rooms={initialRooms} />
        );
        expect(screen.getByText("3 people")).toBeInTheDocument();
        expect(screen.getByText("2 people")).toBeInTheDocument();
        expect(screen.getByText("4 people")).toBeInTheDocument();
    });
    it("displays 0 people if there is no one in the room", () => {
        const emptyRoom: RoomType = {
            id: 1,
            name: "Study Group",
            users: [],
            dateCreated: new Date("2026-08-30"),
            isActive: false
        };
        render (
            <DisplayRooms rooms={[emptyRoom]} />
        );
        expect(screen.getByText("0 people")).toBeInTheDocument();
        expect(screen.getByText("Inactive")).toBeInTheDocument(); //it should be inactive if there are no people inside.
    });
})