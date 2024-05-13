import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { v4 as uuidv4 } from 'uuid'
import classnames from 'classnames'
import { io } from 'socket.io-client'

import { cellTypes, eventTypes, orientations, playerAliases } from 'backend/src/shared'

import "./index.css"

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

enum gameModes {
  shipPlacement = "shipPlacement",
  playing = "playing",
}

const ShipPlacement = ({
  map,
} : {
  map:Map,
}) => {
  const [orientation, setOrientation] = useState<orientations>(orientations.horizontal)
  const ships = [
    {
      width: 5,
      height: 1,
      [orientations.horizontal]: {
        x: 0,
        y: 3,
      },
      [orientations.vertical]: {
        x: 2,
        y: 0,
      },
    },
    {
      width: 4,
      height: 1,
      [orientations.horizontal]: {
        x: 6,
        y: 3,
      },
      [orientations.vertical]: {
        x: 6,
        y: 0,
      },
    },
    {
      width: 3,
      height: 1,
      [orientations.horizontal]: {
        x: 0,
        y: 5,
      },
      [orientations.vertical]: {
        x: 0,
        y: 5,
      },
    },
    {
      width: 3,
      height: 1,
      [orientations.horizontal]: {
        x: 4,
        y: 5,
      },
      [orientations.vertical]: {
        x: 4,
        y: 5,
      },
    },
    {
      width: 2,
      height: 1,
      [orientations.horizontal]: {
        x: 8,
        y: 5,
      },
      [orientations.vertical]: {
        x: 8,
        y: 5,
      },
    },
  ]

  const handleRotateClick = () => {
    setOrientation(
      orientation === orientations.horizontal 
        ? orientations.vertical 
        : orientations.horizontal
    )
  }

  return (
    <div className="mx-auto max-w-5xl py-6 flex">
      <div className="px-3 w-1/2">
        <div className="flex flex-wrap aspect-square">
          {map.cells.map((value, index) => {
            return (
              <div
                key={index}
                className={`border border-gray-500 aspect-square`}
                style={{
                  width: `${100 / map.size}%`,
                  fontSize: "12px",
                }}
              ></div>
            )
          })}
        </div>
      </div>
      <div className="px-3 w-1/2">
        <div className="flex flex-wrap aspect-square relative">
          {ships.map((ship, index) => {
            const cellSize = 100 / 10

            const x = orientation === orientations.horizontal ? ship.horizontal.x : ship.vertical.x
            const y = orientation === orientations.horizontal ? ship.horizontal.y : ship.vertical.y

            const transform = orientation === orientations.vertical
              ? `translateY(-100%) rotate(90deg)`
              : "none"

            return (
              <div
                className="absolute bg-blue-400 origin-bottom-left"
                style={{
                  width: `${cellSize * ship.width}%`,
                  height: `${cellSize * ship.height}%`,
                  top: `${cellSize * y}%`,
                  left: `${cellSize * x}%`,
                  transform,
                }}
                key={index}
              ></div>
            )
          })}
          {map.cells.map((value, index) => {
            return (
              <div
                key={index}
                className={`border border-gray-500 aspect-square`}
                style={{
                  width: `${100 / map.size}%`,
                  fontSize: "12px",
                }}
              ></div>
            )
          })}
          <button 
            type="button"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-400 text-24 font-bold rounded-6"
            onClick={handleRotateClick}
          >
            Rotate
          </button>
        </div>
      </div>
    </div>
  )
}

const App = () => {
  const [gameMode, setGameMode] = useState<gameModes>(gameModes.shipPlacement)

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

  if (gameMode === gameModes.shipPlacement) {
    return (
      <ShipPlacement
        map={map}
      />
    )
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