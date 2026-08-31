import { useState, type FormEvent } from "react";

interface CreateRoomModalProps {
    onCreate: (name: string) => void;
    onCancel: () => void;
}

function CreateRoomModal({ onCreate, onCancel }: CreateRoomModalProps) {
    const [name, setName] = useState("");

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        onCreate(trimmed);
    }

    return (
        <div className="modal-overlay">
            <form className="modal" onSubmit={handleSubmit}>
                <h2>Create Room</h2>
                <label htmlFor="room-name">Room name</label>
                <input
                    id="room-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />
                <div className="modal-actions">
                    <button type="button" onClick={onCancel}>Cancel</button>
                    <button type="submit" disabled={!name.trim()}>Create</button>
                </div>
            </form>
        </div>
    );
}

export default CreateRoomModal;
