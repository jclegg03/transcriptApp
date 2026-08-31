import type { RoomType } from "../types/RoomType";

interface deleteRoomProps {
    roomToDelete: RoomType;
    onConfirm: () => void;
    onCancel: () => void;
} 

function DeleteRoomModal({ roomToDelete, onConfirm, onCancel }: deleteRoomProps) {
    return (
        <div className="modalOverlay">
            <div className="deleteModal">
                <h2>Delete Room</h2>
                <p>
                    Are you sure you want to delete "{roomToDelete.name}"?
                </p>
                <button onClick={onConfirm}>
                    Delete Room
                </button>
                <button onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </div>
    )
} 

export default DeleteRoomModal;