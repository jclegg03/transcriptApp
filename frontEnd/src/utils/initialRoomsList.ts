import type { RoomType } from "../types/RoomType";

export const initialRooms: RoomType[] = [
    {
        id: 1,
        name: "Study Group",
        users: [
            {
                id: 1,
                name: "Sarah",
                role: "SPEAKER"
            },
            {
                id: 2,
                name: "James",
                role: "LISTENER"
            },
            {
                id: 3,
                name: "Emily",
                role: "LISTENER"
            }
        ],
        dateCreated: new Date("2026-08-30"),
        isActive: true
    },
    {
        id: 2,
        name: "Book Club",
        users: [
            {
                id: 4,
                name: "Michael",
                role: "SPEAKER"
            },
            {
                id: 5,
                name: "Jessica",
                role: "LISTENER"
            }
        ],
        dateCreated: new Date("2026-08-29"),
        isActive: false
    },
    {
        id: 3,
        name: "Project Meeting",
        users: [
            {
                id: 6,
                name: "Alex",
                role: "SPEAKER"
            },
            {
                id: 7,
                name: "Taylor",
                role: "LISTENER"
            },
            {
                id: 8,
                name: "Jordan",
                role: "LISTENER"
            },
            {
                id: 9,
                name: "Morgan",
                role: "LISTENER"
            }
        ],
        dateCreated: new Date("2026-08-28"),
        isActive: true
    }
];