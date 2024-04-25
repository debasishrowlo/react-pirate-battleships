import { useEffect } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"

import { io } from 'socket.io-client';

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:4000';

const socket = io(URL, { transports : ['websocket'] })

const App = () => {
  console.log(socket.connected)

  useEffect(() => {
    socket.connect()

    socket.on('connect', () => { console.log("connected") });
    socket.on('disconnect', () => { console.log("disconnected") });
    socket.on('fire', () => { console.log("on: under attack") });

    return () => {
      socket.disconnect()

      socket.off('connect', () => { console.log("connected") });
      socket.off('disconnect', () => { console.log("disconnected") });
      socket.off('fire', () => { console.log("off: under attack") });
    }
  }, [])

  return (
    <div>
      <button type="button" onClick={() => socket.emit("fire")}>Fire</button>
    </div>
  )
}

createRoot(document.getElementById("app")).render(<App />)