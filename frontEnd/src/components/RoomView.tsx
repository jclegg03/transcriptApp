import type { RoomMembership } from "../types/RoomMembership"; 
import '../styles/Room.css'; 
import '../styles/App.css';


interface RoomViewProps {
    membership: RoomMembership;
    onLeave: () => void;
}

function RoomView({ membership, onLeave }: RoomViewProps) {
    const isSpeaker = membership.role === "SPEAKER";

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
                    <span className="roomInfoLabel">Participants</span>
                    <span className="roomInfoValue">
                        1
                    </span>
                </div>

                <div className="roomStatusBox">
                    <span className="roomInfoLabel">Status</span>
                    <span className="roomInfoValue">
                        {isSpeaker ? "Ready to speak" : "Listening"}
                    </span>
                </div>
            </section>

            {/* Transcript */}
            <section className="transcriptSection">
                <div className="sectionHeader">
                    <h2>Transcript</h2>
                </div>

                <div className="transcriptArea">
                    <p className="emptyTranscript">
                        The transcript will appear here.
                    </p>
                </div>
            </section>

            {/* Speaking Controls */}
            {isSpeaker && (
                <section className="speakingSection">
                    <h2>Speaking</h2>

                    <p>
                        Press the button below when you are ready to speak.
                    </p>

                    <button className="speakButton">
                        Start Speaking
                    </button>
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