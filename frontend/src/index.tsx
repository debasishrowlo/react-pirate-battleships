import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { v4 as uuidv4 } from 'uuid'

import "./index.css"

import { io } from 'socket.io-client'

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:4000'

const socket = io(URL, { transports : ['websocket'] })

type Map = {
  size: number,
  cells: number[],
}

const App = () => {
  const [map, setMap] = useState<Map|null>(null)
  console.log(map)

  useEffect(() => {
    socket.connect()

    socket.on('connect', () => {
      // const localStorageUserId = localStorage.getItem("userId")

      // let userId = null

      // if (localStorageUserId !== null) {
      //   userId = localStorageUserId
      // } else {
      //   userId = uuidv4()
      //   localStorage.setItem("userId", userId)
      // }

      // socket.emit("init", { userId })
      socket.emit("init")
    })
    socket.on('init', (map) => {
      setMap(map)
    })
    socket.on('disconnect', () => { console.log("disconnected") })
    socket.on('fire', () => { console.log("on: under attack") })

    return () => {
      socket.disconnect()

      socket.off('connect', () => { console.log("connected") })
      socket.off('init', () => { console.log("init") })
      socket.off('disconnect', () => { console.log("disconnected") })
      socket.off('fire', () => { console.log("off: under attack") })
    }
  }, [])

  if (map === null) {
    return null
  }

  return (
    <div className="py-6 flex">
      <div className="px-3 w-1/2">
        <div className="flex flex-wrap aspect-square">
          {map.cells.map((value, index) => {
            const backgroundColor = value === 0 ? "transparent" : "blue"

            return (
              <div 
                key={index}
                className="border border-gray-500 aspect-square"
                style={{
                  width: `${100 / map.size}%`,
                  fontSize: "12px",
                  backgroundColor,
                }}
              >
              </div>
            )
          })}
        </div>
      </div>
      <div className="px-3 w-1/2">
        <div className="flex flex-wrap aspect-square">
          {map.cells.map((value, index) => {
            return (
              <button 
                key={index}
                type="button"
                className="border border-gray-500 aspect-square bg-transparent hover:bg-gray-200"
                style={{
                  width: `${100 / map.size}%`,
                  fontSize: "12px",
                }}
                onClick={() => socket.emit("fire", index)}
              >
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById("app")).render(<App />)