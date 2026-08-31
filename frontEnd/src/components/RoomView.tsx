import type { RoomMembership } from "../types/RoomMembership";

interface RoomViewProps {
    membership: RoomMembership;
    onLeave: () => void;
}

function RoomView({ membership, onLeave }: RoomViewProps) {
    return (
        <div>
            <h2>{membership.name}</h2>
            <p>Room code: {membership.roomId}</p>
            <p>
                {membership.role === "SPEAKER"
                    ? "You are the speaker."
                    : "You are listening."}
            </p>
            <button onClick={onLeave}>Leave Room</button>
        </div>
    );
}

export default RoomView;
