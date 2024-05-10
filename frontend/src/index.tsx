import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { v4 as uuidv4 } from 'uuid'
import classnames from 'classnames'

import { cellTypes, eventTypes, playerAliases } from 'backend/src/shared'

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
  canBeAttacked,
} : {
  map: Map,
  isDisabled: boolean,
  userId: string,
  canBeAttacked: boolean,
}) => {
  const handleClick = (index:number) => {
    socket.emit(eventTypes.fire, {
      userId,
      index,
    })
  }

  return (
    <div
      className={classnames("flex flex-wrap aspect-square border-4 transition duration-500", {
        "border-transparent opacity-70": !canBeAttacked,
        "border-blue-500": canBeAttacked,
      })}
    >
      {map.cells.map((value, index) => {
        let bgClasses = "bg-transparent"

        if (canBeAttacked && !isDisabled) {
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
  const [activePlayer, setActivePlayer] = useState<playerAliases|null>(null)

  const handleHit = (args: {
    index: number, 
    playerAlias: playerAliases,
    winner: playerAliases | null,
  }) => {
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
      setEnemyMap({
        ...enemyMap,
        cells: [
          ...enemyMap.cells.slice(0, args.index),
          cellTypes.damagedShip,
          ...enemyMap.cells.slice(args.index + 1),
        ],
      })
    }

    if (args.winner) {
      console.log(`${args.winner} is the winner`)
    }
  }

  const handleMiss = (args: { index: number, playerAlias: playerAliases }) => {
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
    setActivePlayer(activePlayer === playerAliases.p1 ? playerAliases.p2 : playerAliases.p1)
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
    socket.emit(eventTypes.join, { userId })
  }

  const handleJoin = (data: {
    map: Map,
    enemyMap: Map,
    playerAlias: playerAliases,
    activePlayer: playerAliases,
  }) => {
    setMap(data.map)
    setEnemyMap(data.enemyMap)
    setPlayerAlias(data.playerAlias)
    setActivePlayer(data.activePlayer)
  }

  useEffect(() => {
    socket.connect()

    socket.on(eventTypes.connect, handleConnect)
    socket.on(eventTypes.join, handleJoin)
    socket.on(eventTypes.disconnect, () => { console.log("disconnected") })

    return () => {
      socket.disconnect()

      socket.off(eventTypes.connect, handleConnect)
      socket.off(eventTypes.join, handleJoin)
      socket.off(eventTypes.disconnect, () => { console.log("disconnected") })
    }
  }, [])

  useEffect(() => {
    socket.on(eventTypes.hit, handleHit)
    socket.on(eventTypes.miss, handleMiss)

    return () => {
      socket.off(eventTypes.hit, handleHit)
      socket.off(eventTypes.miss, handleMiss)
    }
  }, [map, enemyMap, playerAlias])

  if (map === null) {
    return null
  }

  return (
    <div className="mx-auto max-w-5xl py-6 flex">
      <div className="px-3 w-1/2">
        <Map 
          map={map} 
          isDisabled={true}
          userId={userId}
          canBeAttacked={playerAlias !== activePlayer}
        />
      </div>
      <div className="px-3 w-1/2">
        <Map 
          map={enemyMap} 
          isDisabled={false}
          userId={userId}
          canBeAttacked={playerAlias === activePlayer}
        />
      </div>
    </div>
  )
}

createRoot(document.getElementById("app")).render(<App />)