import type { RoomType } from "../types/RoomType";
import type { UserType } from "../types/UserType"; 

interface displayRoomsProps {
    //need something to get the room data that it is creating for 
    rooms: RoomType[];
    onDeleteRoom: (roomId: number) => void;
} 

function DisplayRooms({ rooms, onDeleteRoom } : displayRoomsProps) {
    if (rooms.length === 0) {
        return <p className="noRooms">No rooms. Create one to get started.</p>;
    }

    return (
        <div className="roomDisplayArea">
            {rooms.map((room) => (
                <div className="roomCard" key={room.id}>
                    <h2>
                        {room.name}
                    </h2>
                    <p 
                        className={`roomStatus ${
                            room.isActive ? "active" : "inactive"
                        }`}
                    >
                        {room.isActive ? "Active" : "Inactive"}
                    </p>
                    <p className="roomPeople">
                        {room.users.length} people
                    </p>
                    <button>
                        Join Room
                    </button>
                    <button className="deleteButton" onClick={() => onDeleteRoom(room.id)}>
                        Delete Room
                    </button> 
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