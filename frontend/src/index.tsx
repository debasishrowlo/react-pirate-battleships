import { useEffect } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"

import { io } from 'socket.io-client'

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:4000'

const socket = io(URL, { transports : ['websocket'] })

const App = () => {
  useEffect(() => {
    socket.connect()

    socket.on('connect', () => { console.log("connected") })
    socket.on('disconnect', () => { console.log("disconnected") })
    socket.on('fire', () => { console.log("on: under attack") })

    return () => {
      socket.disconnect()

      socket.off('connect', () => { console.log("connected") })
      socket.off('disconnect', () => { console.log("disconnected") })
      socket.off('fire', () => { console.log("off: under attack") })
    }
  }, [])

  // const x = 2
  // const y = 2
  // const cellPerRow = 5
  // const index = y * cellPerRow + x
  const mapSize = 10
  const cellCount = mapSize * mapSize
  const map = Array(cellCount).fill(0)

  const orientations = {
    horizontal: "horizontal",
    vertical: "vertical",
  }

  const ships = [
    {
      cell: { x: 0, y: 0 },
      length: 5,
      orientation: orientations.horizontal,
    },
    {
      cell: { x: 0, y: 2 },
      length: 3,
      orientation: orientations.horizontal,
    },
    {
      cell: { x: 3, y: 5 },
      length: 3,
      orientation: orientations.horizontal,
    },
  ]

  for (let i = 0; i < ships.length; i++) {
    const ship = ships[i]
    const cell = ship.cell

    for (let j = 0; j < ship.length; j++) {
      const index = cell.y * mapSize + cell.x
      map[index] = 1
      cell.x += 1
    }
  }
  console.log(map)

  return (
    <div>
      {/* <button type="button" onClick={() => socket.emit("fire")}>Fire</button> */}
      <div className="w-1/3 flex flex-wrap aspect-square">
        {map.map((value, index) => {
          const backgroundColor = value === 0 ? "transparent" : "blue"

          return (
            <button 
              type="button"
              className="border border-gray-500 aspect-square"
              style={{
                width: `${100 / mapSize}%`,
                fontSize: "12px",
                backgroundColor,
              }}
            >
              {/* {index} */}
            </button>
          )
        })}
      </div>
    </div>
  )
}

createRoot(document.getElementById("app")).render(<App />)