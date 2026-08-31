import type { RoomType } from "../types/RoomType";

interface displayRoomsProps {
    rooms: RoomType[];
    onJoinRoom: (room: RoomType) => void;
}

function DisplayRooms({ rooms, onJoinRoom }: displayRoomsProps) {
    return (
        <div>
            {rooms.map((room) => (
                <div key={room.roomId}>
                    <h2>
                        {room.name}
                    </h2>
                    <p>
                        {room.status === "live" ? "Active" : "Inactive"}
                    </p>
                    <p>
                        {room.listenerCount + (room.hasSpeaker ? 1 : 0)} people
                    </p>
                    <button onClick={() => onJoinRoom(room)}>
                        Join Room
                    </button>
                    <button>
                        Delete Room
                    </button>
                </div>
            ))}

        </div>
    )
}

export default DisplayRooms;
