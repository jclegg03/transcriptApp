import type { RoomMembership } from "../types/RoomMembership";
import type { EndReason, RoomLiveStatus } from "../hooks/useRoomSocket";
import { useRoomSocket } from "../hooks/useRoomSocket";

interface RoomViewProps {
    membership: RoomMembership;
    onLeave: () => void;
}

function describeEndReason(reason: EndReason): string {
    switch (reason) {
        case "speaker-ended":
            return "The speaker ended this room.";
        case "speaker-timeout":
            return "This room ended because the speaker didn't reconnect in time.";
        case "server-shutdown":
            return "This room ended because the server shut down.";
    }
}

function describeRoomStatus(status: RoomLiveStatus, isSpeaker: boolean): string {
    switch (status) {
        case "created":
            return isSpeaker ? "Waiting for you to start speaking." : "Waiting for the speaker to join...";
        case "live":
            return "Live";
        case "speaker-reconnecting":
            return "The speaker disconnected and has a little while to reconnect.";
    }
}

function RoomView({ membership, onLeave }: RoomViewProps) {
    const { connectionStatus, roomStatus, listenerCount, transcript, sttStatus, endReason, fatalError, endRoom } =
        useRoomSocket(membership);
    const isSpeaker = membership.role === "SPEAKER";

    if (endReason) {
        return (
            <div>
                <h2>{membership.name}</h2>
                <p role="status">{describeEndReason(endReason)}</p>
                <button onClick={onLeave}>Back to Rooms</button>
            </div>
        );
    }

    return (
        <div>
            <h2>{membership.name}</h2>
            <p>Room code: {membership.roomId}</p>
            <p>{isSpeaker ? "You are the speaker." : "You are listening."}</p>
            <p>Connection: {connectionStatus}</p>
            {fatalError && <p role="alert">{fatalError.message}</p>}
            {roomStatus && <p>{describeRoomStatus(roomStatus, isSpeaker)}</p>}
            <p>
                {listenerCount} listener{listenerCount === 1 ? "" : "s"}
            </p>

            {isSpeaker ? (
                <div>
                    {/* Seam for microphone capture (out of scope for now): once
                        connectionStatus === "open" && roomStatus === "live", start
                        getUserMedia + PCM streaming here (binary ws.send frames to
                        match room.sttSession.write(data) on the backend), and stop
                        it on end-room / unmount. */}
                    {sttStatus?.state === "error" && (
                        <p role="alert">Transcription error: {sttStatus.message}</p>
                    )}
                    <button onClick={endRoom} disabled={connectionStatus !== "open"}>
                        End Room
                    </button>
                    <p>Ending the room disconnects every listener immediately. Leaving keeps the room open for 30 seconds in case you reconnect.</p>
                </div>
            ) : (
                <ul aria-label="Transcript">
                    {transcript.map((segment) => (
                        <li key={segment.segmentId} className={segment.isFinal ? "final" : "interim"}>
                            {segment.text}
                        </li>
                    ))}
                </ul>
            )}

            <button onClick={onLeave}>Leave Room</button>
        </div>
    );
}

export default RoomView;
