import { useState } from 'react'

import type { RoleType } from "./types/RoleType";
import type { RoomType } from "./types/RoomType";
import type { TranscriptType } from "./types/TranscriptType";
import type { UserType } from "./types/UserType";

import { initialRooms } from "./utils/initialRoomsList";
import { DisplayRooms } from "./components/DisplayRooms";
//component imports goes here

import './styles/App.css'

function App() {
  const [rooms, setRooms] = useState<RoomType[]>(initialRooms);
  const [showNameModal, setShowNameModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);

  //this one is just for testing for now
  const [currentUser, setCurrentUser] = useState<UserType>({
    id: 100, //because this number has not been used yet in initialRooms
    role: "LISTENER",
    name: "Audrey"
  });
  /*
  To do:
  1. Create room
    - Modal where the user can enter the name of the room 

  2. Join room
    - Opens a popup that allows the user to enter a name before joining a room
  
  3. Display all the rooms
    - Join room
    - If there is soemone speaking in that room, then show that it is active. If not, show inactive
    - How many people are in the room
    - If the user matches the creator of the room, then they can also see delete room button 
    - Clicking the delete room opens the modal which is basically just a "Are you sure?" kind of thing
  
  NOTE THAT DELETE ROOM FUNCTIONALITY WILL BE DONE LAST AS THAT WILL ALSO REQUIRE LOGIN STUFF 
  */
  return (
    <main className="app">
      <h1>TITLE</h1>
      <div className="roomDisplayArea">
        <DisplayRooms rooms={rooms} currentUser={currentUser} />
      </div>
    </main>
  )
}

export default App
 

/*
Brainstorm:
1. Have a main room page where someone can join in, create, and delete rooms
2. Have a room page where someone can press a speech button (to send the transcription). Viewing the transcription 
shouldn't require anything
3. Each room page should also have a leave room which gets them back to the main page.


Styling
1. Need to style it for mobile
2. Maybe figure out how to host it somewhere so phones can access it?


Programming
1. Make sure to have a test for each function
2. Types:
  - Something to keep track of users. Their ID, status (speaking or listening), and probably which room they are in **
  - Something to keep track of rooms. The room ID, name, users in the room, who created it, and when it was created **
  - Something to keep track of the message. The ID, speakerID, speakerName, text, timestamp, whether or not it is finished **
  - Something to keep track of the overall state of the room 
3. Accessibility
  - Settings for dark mode/light mode
  - Settings for font size

Design:
  - Maybe the home page could just be the rooms page. Then when the user clicks on a room, they can enter their name then.
  - The main room page should display
    - Each room should be in a card.
    - Each card should display
       - The name of the room
       - Date created
       - Number of participants
       - If it is active
       - If the user's ID matches the person who created the room, then there will be a delete room button
  - Each room page should display:
    - Maybe number of participants
    - The button to speak
    - Transcript area
    - Button to leave

*/