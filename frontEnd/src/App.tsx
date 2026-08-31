//import { useState } from 'react'
import './styles/App.css'

function App() {

  return (
    <>
      <h1>Testing</h1>
    </>
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
  - Something to keep track of the overall state of hte room 
3. Accessibility
  - Settings for dark mode/light mode
  - Settings for font size
  

*/