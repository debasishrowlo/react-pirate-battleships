import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { v4 as uuidv4 } from 'uuid'

import { cellTypes } from 'backend/src/shared'

import "./index.css"

import { io } from 'socket.io-client'

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:4000'

const socket = io(URL, {
  transports : ['websocket'],
  query: {
    test: "test",
  },
})

type Map = {
  size: number,
  cells: number[],
}

const Map = ({
  map,
  isDisabled,
  userId,
} : {
  map: Map,
  isDisabled: boolean,
  userId: string,
}) => {
  const handleClick = (index:number) => {
    socket.emit("fire", {
      userId,
      index,
    })
  }

  return (
    <div className="flex flex-wrap aspect-square">
      {map.cells.map((value, index) => {
        let bgClasses = "bg-transparent"

        if (!isDisabled) {
          bgClasses += " hover:bg-gray-200"
        }

        if (value === cellTypes.ship) {
          bgClasses = "bg-blue-500"
        } else if (value === cellTypes.damagedShip) {
          bgClasses = "bg-red-500"
        } else if (value === cellTypes.miss) {
          bgClasses = "bg-gray-400"
        }

        return (
          <button
            type="button"
            key={index}
            className={`border border-gray-500 aspect-square ${bgClasses}`}
            style={{
              width: `${100 / map.size}%`,
              fontSize: "12px",
            }}
            onClick={() => handleClick(index)}
            disabled={isDisabled}
          >
          </button>
        )
      })}
    </div>
  )
}

const App = () => {
  const [map, setMap] = useState<Map|null>(null)
  const [enemyMap, setEnemyMap] = useState<Map|null>(null)
  const [userId, setUserId] = useState(null)

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
      
      setUserId(userId)
      socket.emit("init", { userId })
    })

    socket.on('init', (data) => {
      setMap(data.map)
      setEnemyMap(data.enemyMap)
    })

    socket.on('disconnect', () => { console.log("disconnected") })
    socket.on('fire', () => { console.log("on: under attack") })
    socket.on('hit', () => {
      console.log("attack successful")
    })
    socket.on('miss', () => {
      console.log("attack missed")
    })

    return () => {
      socket.disconnect()

      socket.off('connect', () => { console.log("connected") })
      socket.off('init', () => { console.log("init") })
      socket.off('disconnect', () => { console.log("disconnected") })
      socket.off('fire', () => { console.log("off: under attack") })
      socket.off('hit', () => {})
      socket.off('miss', () => {})
    }
  }, [])

  if (map === null) {
    return null
  }

  return (
    <div className="py-6 flex">
      <div className="px-3 w-1/2">
        <Map 
          map={map} 
          isDisabled={true}
          userId={userId}
        />
      </div>
      <div className="px-3 w-1/2">
        <Map 
          map={enemyMap} 
          isDisabled={false}
          userId={userId}
        />
      </div>
    </div>
  )
}

createRoot(document.getElementById("app")).render(<App />)