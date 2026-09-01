import { useEffect } from "react";
import type { RoomMembership } from "../types/RoomMembership";
import type { EndReason, RoomLiveStatus } from "../hooks/useRoomSocket";
import { useRoomSocket } from "../hooks/useRoomSocket";
import { useMicStream } from "../hooks/useMicStream";

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
    const {
        connectionStatus,
        roomStatus,
        listenerCount,
        transcript,
        sttStatus,
        endReason,
        fatalError,
        endRoom,
        sendAudioChunk,
    } = useRoomSocket(membership);
    const isSpeaker = membership.role === "SPEAKER";

    const { status: micStatus, error: micError, start: startMic, stop: stopMic } = useMicStream(sendAudioChunk);
    const micEligible = connectionStatus === "open" && roomStatus === "live";

    useEffect(() => {
        if (!micEligible) stopMic();
    }, [micEligible, stopMic]);

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
                    {sttStatus?.state === "error" && (
                        <p role="alert">Transcription error: {sttStatus.message}</p>
                    )}
                    {micError && <p role="alert">{micError.message}</p>}
                    <button
                        onClick={micStatus === "streaming" ? stopMic : startMic}
                        disabled={!micEligible || micStatus === "starting"}
                    >
                        {micStatus === "streaming" ? "Stop Speaking" : "Start Speaking"}
                    </button>
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
