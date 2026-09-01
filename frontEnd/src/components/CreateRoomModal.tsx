import { useState } from "react";

interface createRoomProps {
    /*
        Need something to send back that will actually create the room, holding the room name and date created
    */
   onAddRoom: (room: string) => void;
   onCloseAddRoom: () => void;
} 

function CreateRoomModal({ onAddRoom, onCloseAddRoom }: createRoomProps) {
    const [roomName, setRoomName] = useState("");

    const creationDate = new Date();

    return (
        <div className="modalOverlay">
            <div className="modal">
                <h2>Create Room</h2>
                <div className="createRoomFormArea">
                    <form
                        onSubmit={(event) => {
                        event.preventDefault();
                        onAddRoom(roomName);
                    }}
                    >
                        <p>Creation Date: {creationDate.toLocaleDateString()}</p>
                        <label>
                            Please enter a room name: 
                            <input type="text" placeholder="Enter name..." value={roomName} onChange={(event) => setRoomName(event.target.value)} />
                        </label>
                        <button type="submit" className="primaryButton">
                            Add and Join Room
                        </button>
                        <button type="button" onClick={onCloseAddRoom} className="secondaryButton">
                            Cancel
                        </button>
                    </form>

                </div>
                
            </div>
        </div>
    )
} 

export default CreateRoomModal; 
