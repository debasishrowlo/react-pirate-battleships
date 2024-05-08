import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { v4 as uuidv4 } from 'uuid'

import { cellTypes, playerAliases } from 'backend/src/shared'

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
  const [playerAlias, setPlayerAlias] = useState<playerAliases|null>(null)
  console.log({ map, enemyMap, playerAlias })

  const handleHit = (args: { index: number, playerAlias: playerAliases }) => {
    console.log("attack successful", args)
    if (args.playerAlias === playerAlias) {
      setMap({
        ...map,
        cells: [
          ...map.cells.slice(0, args.index),
          cellTypes.damagedShip,
          ...map.cells.slice(args.index + 1),
        ],
      })
    } else {
      console.log({ enemyMap })
      setEnemyMap({
        ...enemyMap,
        cells: [
          ...enemyMap.cells.slice(0, args.index),
          cellTypes.damagedShip,
          ...enemyMap.cells.slice(args.index + 1),
        ],
      })
    }
  }

  const handleMiss = (args: { index: number, playerAlias: playerAliases }) => {
    console.log(map, enemyMap, playerAlias)
    console.log("attack missed", args)

    if (args.playerAlias === playerAlias) {
      setMap({
        ...map,
        cells: [
          ...map.cells.slice(0, args.index),
          cellTypes.miss,
          ...map.cells.slice(args.index + 1),
        ],
      })
    } else {
      setEnemyMap({
        ...enemyMap,
        cells: [
          ...enemyMap.cells.slice(0, args.index),
          cellTypes.miss,
          ...enemyMap.cells.slice(args.index + 1),
        ],
      })
    }
  }

  const handleConnect = () => {
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
  }

  const handleInit = (data: {
    map: Map,
    enemyMap: Map,
    playerAlias: playerAliases,
  }) => {
    setMap(data.map)
    setEnemyMap(data.enemyMap)
    setPlayerAlias(data.playerAlias)
  }

  useEffect(() => {
    socket.connect()

    socket.on('connect', handleConnect)
    socket.on('init', handleInit)
    socket.on('disconnect', () => { console.log("disconnected") })
    socket.on('fire', () => { console.log("on: under attack") })

    return () => {
      socket.disconnect()

      socket.off('connect', handleConnect)
      socket.off('init', handleInit)
      socket.off('disconnect', () => { console.log("disconnected") })
      socket.off('fire', () => { console.log("off: under attack") })
    }
  }, [])

  useEffect(() => {
    socket.on('hit', handleHit)
    socket.on('miss', handleMiss)

    return () => {
      socket.off('hit', handleHit)
      socket.off('miss', handleMiss)
    }
  }, [map, enemyMap, playerAlias])

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