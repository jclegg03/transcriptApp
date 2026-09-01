import type { RoomType } from "../types/RoomType";

interface displayRoomsProps {
    rooms: RoomType[];
    onDeleteRoom: (roomId: string) => void;
    onJoinRoom: (room: RoomType) => void;
}

function DisplayRooms({ rooms, onJoinRoom, onDeleteRoom }: displayRoomsProps) {
    if (rooms.length === 0) {
        return <p className="noRooms">No rooms. Create one to get started.</p>;
    }
    return (
        <div className="roomDisplayArea">
            {rooms.map((room) => (
                <div className="roomCard" key={room.roomId}>
                    <h2>
                        {room.name}
                    </h2>
                    <p 
                        className={`roomStatus ${
                            room.status === "live" ? "active" : "inactive"
                        }`}
                    >
                        {room.status === "live" ? "Active" : "Inactive"}
                    </p>
                    <p className="roomPeople">
                        {room.listenerCount + (room.hasSpeaker ? 1 : 0)} people
                    </p>
                    <button onClick={() => onJoinRoom(room)}>
                        Join Room
                    </button>
                    <button className="deleteButton" onClick={() => onDeleteRoom(room.roomId)}>
                        Delete Room
                    </button>
                </div>
            ))}

        </div>
    )
}

export default DisplayRooms;
