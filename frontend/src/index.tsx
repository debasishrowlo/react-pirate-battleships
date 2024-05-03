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

const cellTypes = {
  empty: 0,
  ship: 1,
  damagedShip: 2,
  miss: 3,
}

const Map = ({ map } : { map: Map }) => {
  return (
    <div className="flex flex-wrap aspect-square">
      {map.cells.map((value, index) => {
        let backgroundColor = "transparent"

        if (value === cellTypes.ship) {
          backgroundColor = "blue"
        } else if (value === cellTypes.damagedShip) {
          backgroundColor = "red"
        } else if (value === cellTypes.miss) {
          backgroundColor = "gray"
        }

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
  )
}

const App = () => {
  const [map, setMap] = useState<Map|null>(null)
  const [enemyMap, setEnemyMap] = useState<Map|null>(null)

  useEffect(() => {
    socket.connect()

    socket.on('connect', () => {
      let userId = null

      const localStorageUserId = localStorage.getItem("userId")

      if (localStorageUserId !== null) {
        userId = localStorageUserId
      } else {
        userId = uuidv4()
        localStorage.setItem("userId", userId)
      }

      socket.emit("init", { userId })
    })

    socket.on('init', (data) => {
      setMap(data.map)
      setEnemyMap(data.enemyMap)
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
        <Map map={map} />
      </div>
      <div className="px-3 w-1/2">
        <Map map={enemyMap} />
      </div>
    </div>
  )
}

createRoot(document.getElementById("app")).render(<App />)