import { useEffect, useState } from 'react'

import type { RoomType } from "./types/RoomType";
import type { RoomMembership } from "./types/RoomMembership";

import DisplayRooms from "./components/DisplayRooms";
import DeleteRoomModal from "./components/DeleteRoomModal";
import CreateRoomModal from "./components/CreateRoomModal";
import RoomView from "./components/RoomView";
import { createRoom, listRooms } from "./api/rooms";

import './styles/App.css';

function App() {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<RoomType | null>(null);
  const [membership, setMembership] = useState<RoomMembership | null>(null);

  function hideAllModals() {
    setShowCreateRoomModal(false);
    setShowDeleteRoomModal(false);
  }

  async function refreshRooms() {
    try {
      const fetched = await listRooms();
      setRooms(fetched);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load rooms");
    }
  }

  useEffect(() => {
    refreshRooms();
  }, []);

  function handleDeleteRoom(roomId: string) {
    const room = rooms.find((room) => room.roomId === roomId);
    if (!room) {
      return;
    }
    setRoomToDelete(room);
    setShowDeleteRoomModal(true);
  }

  function confirmDeleteRoom() {
    if (!roomToDelete) {
      return;
    }
    setRooms((currentRooms) =>
      currentRooms.filter((room) => room.roomId !== roomToDelete.roomId)
    );
    setRoomToDelete(null);
    hideAllModals();
  }

  async function handleCreateRoom(name: string) {
    if (name === "") {
      return;
    }
    try {
      const created = await createRoom(name);
      sessionStorage.setItem(`speakerToken:${created.roomId}`, created.speakerToken);
      hideAllModals();
      setMembership({ roomId: created.roomId, name: created.name, role: "SPEAKER" });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to create room");
    }
  }

  function handleJoinRoom(room: RoomType) {
    setMembership({ roomId: room.roomId, name: room.name, role: "LISTENER" });
  }

  function handleLeaveRoom() {
    setMembership(null);
    refreshRooms();
  }

  if (membership) {
    return (
      <main className="app">
        <RoomView membership={membership} onLeave={handleLeaveRoom} />
      </main>
    );
  }

  return (
    <main className="app">
      <h1>TITLE</h1>
      {loadError && <p role="alert">{loadError}</p>}
      <DisplayRooms rooms={rooms} onJoinRoom={handleJoinRoom} onDeleteRoom={handleDeleteRoom} />
      <button onClick={() => setShowCreateRoomModal(true)}>Create Room</button>

      {showCreateRoomModal && (
        <CreateRoomModal
          onAddRoom={handleCreateRoom}
          onCloseAddRoom={() => hideAllModals()}
        />
      )}

      {showDeleteRoomModal && roomToDelete && (
          <DeleteRoomModal
              roomToDelete={roomToDelete}
              onConfirm={confirmDeleteRoom}
              onCancel={() => {
                  setRoomToDelete(null);
                  hideAllModals();
              }}
          />
      )}
    </main>
  )
}

export default App
