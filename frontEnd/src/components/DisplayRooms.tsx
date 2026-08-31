import { useState } from "react";
import type { RoomType } from "../types/RoomType";
import type { UserType } from "../types/UserType"; 

interface displayRoomsProps {
    //need something to get the room data that it is creating for 
    rooms: RoomType[];
    currentUser: UserType;
} 

function DisplayRooms({ rooms, currentUser } : displayRoomsProps) {
    return (
        <div>
            {rooms.map((room) => (
                <div key={room.id}>
                    <h2>
                        {room.name}
                    </h2>
                    <p>
                        {room.isActive ? "Active" : "Inactive"}
                    </p>
                    <p>
                        {room.users.length} people
                    </p>
                    <button>
                        Join Room
                    </button>
                    {room.creator.id === currentUser.id && (
                        <button>
                            Delete Room
                        </button>
                    )}
                </div>
            ))}
        
        </div>
    )
} 

export default DisplayRooms;

// export interface RoomType {
//     id: number;
//     name: string;
//     users: UserType[];
//     creator: UserType;
//     dateCreated: Date;
//     isActive: boolean;
// }