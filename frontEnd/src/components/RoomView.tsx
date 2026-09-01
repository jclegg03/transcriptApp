import '../styles/Room.css'; 
import '../styles/App.css';

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
            <div className="roomView">
                <header className="roomHeader">
                    <h1>{membership.name}</h1>
                    <p role="status">{describeEndReason(endReason)}</p>
                </header>

                <div className="leaveRoomArea">
                    <button className="leaveRoomButton" onClick={onLeave}>
                        Back to Rooms
                    </button>
                </div>
            </div>
        );
    }

    const statusText = roomStatus
        ? describeRoomStatus(roomStatus, isSpeaker)
        : connectionStatus === "closed"
            ? "Disconnected"
            : "Connecting…";

    return (
        <div className="roomView">

            {/* Room Header */}
            <header className="roomHeader">
                <h1>{membership.name}</h1>
                <p className="roomCode">
                    Room code: <strong>{membership.roomId}</strong>
                </p>
            </header>

            {/* Room Status */}
            <section className="roomInfo">
                <div className="roomStatusBox">
                    <span className="roomInfoLabel">Your role</span>
                    <span className="roomInfoValue">
                        {isSpeaker ? "Speaker" : "Listener"}
                    </span>
                </div>

                <div className="roomStatusBox">
                    <span className="roomInfoLabel">Listeners</span>
                    <span className="roomInfoValue">
                        {listenerCount}
                    </span>
                </div>

                <div className="roomStatusBox">
                    <span className="roomInfoLabel">Status</span>
                    <span className="roomInfoValue">
                        {statusText}
                    </span>
                </div>
            </section>

            {fatalError && <p role="alert">{fatalError.message}</p>}

            {/* Transcript */}
            <section className="transcriptSection">
                <div className="sectionHeader">
                    <h2>Transcript</h2>
                </div>

                <div className="transcriptArea">
                    {transcript.length === 0 ? (
                        <p className="emptyTranscript">
                            The transcript will appear here.
                        </p>
                    ) : (
                        <ul aria-label="Transcript">
                            {transcript.map((segment) => (
                                <li key={segment.segmentId} className={segment.isFinal ? "final" : "interim"}>
                                    {segment.text}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            {/* Speaking Controls */}
            {isSpeaker && (
                <section className="speakingSection">
                    <h2>Speaking</h2>

                    {sttStatus?.state === "error" && (
                        <p role="alert">Transcription error: {sttStatus.message}</p>
                    )}
                    {micError && <p role="alert">{micError.message}</p>}

                    <p>
                        {micStatus === "streaming"
                            ? "You're live. Press stop when you're done."
                            : "Press the button below when you are ready to speak."}
                    </p>

                    <button
                        className="speakButton"
                        onClick={micStatus === "streaming" ? stopMic : startMic}
                        disabled={!micEligible || micStatus === "starting"}
                    >
                        {micStatus === "streaming" ? "Stop Speaking" : "Start Speaking"}
                    </button>

                    <button onClick={endRoom} disabled={connectionStatus !== "open"}>
                        End Room
                    </button>
                    <p>Ending the room disconnects every listener immediately. Leaving keeps the room open for 30 seconds in case you reconnect.</p>
                </section>
            )}

            {/* Leave Room */}
            <div className="leaveRoomArea">
                <button
                    className="leaveRoomButton"
                    onClick={onLeave}
                >
                    Leave Room
                </button>
            </div>
        </div>
    );
}

export default RoomView;