import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { v4 as uuidv4 } from 'uuid'
import classnames from 'classnames'
import { Dialog, DialogPanel } from '@headlessui/react'
import { io } from 'socket.io-client'

import {
  JoinEventPayload,
  cellTypes, 
  eventTypes, 
  orientations, 
  playerAliases,
} from 'backend/src/shared/types'
import { getPositionFromIndex } from 'backend/src/shared/utils'

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
  waitingForPlayer = "waitingForPlayer",
  battle = "battle",
}

const v2 = (x = 0, y = 0) => {
  return { x, y }
}

const ShipPlacement = ({
  map,
  userId,
  gameMode,
} : {
  map:Map,
  userId: string,
  gameMode: gameModes,
}) => {
  const ships = [
    {
      length: 5,
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
      length: 4,
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
      length: 3,
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
      length: 3,
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
      length: 2,
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

  type PlacedShip = {
    cellIndex: number,
    shipIndex: number,
    orientation: orientations,
  }

  const [orientation, setOrientation] = useState<orientations>(orientations.horizontal)
  const [pickedIndex, setPickedIndex] = useState<number|null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number|null>(null)
  // const [placedShips, setPlacedShips] = useState<PlacedShip[]>([])
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([
    {
      "cellIndex": 5,
      "shipIndex": 0,
      "orientation": orientations.horizontal,
    },
    {
      "cellIndex": 16,
      "shipIndex": 1,
      "orientation": orientations.horizontal,
    },
    {
      "cellIndex": 27,
      "shipIndex": 2,
      "orientation": orientations.horizontal,
    },
    {
      "cellIndex": 37,
      "shipIndex": 3,
      "orientation": orientations.horizontal,
    },
    {
      "cellIndex": 48,
      "shipIndex": 4,
      "orientation": orientations.horizontal,
    },
  ])
  const [isPlacementValid, setIsPlacementValid] = useState(true)

  const isPlacementComplete = (
    isPlacementValid &&
    placedShips.length === ships.length
  )

  let shipPreview = null

  if (pickedIndex !== null && hoveredIndex !== null) {
    const cellSize = 100 / map.size
    const ship = ships[pickedIndex]

    const { x, y } = getPositionFromIndex(hoveredIndex, map.size)
    const transform = orientation === orientations.vertical
      ? `translateY(-100%) rotate(90deg)`
      : "none"

    shipPreview = {
      width: `${cellSize * ship.length}%`,
      height: `${cellSize}%`,
      top: `${cellSize * y}%`,
      left: `${cellSize * x}%`,
      transform,
    }
  }

  const handleRotateClick = () => {
    setOrientation(
      orientation === orientations.horizontal 
        ? orientations.vertical 
        : orientations.horizontal
    )
  }

  const isShipPlaced = (index:number) => {
    return placedShips.some(placedShip => placedShip.shipIndex === index)
  }

  const handlePlacedShipClick = (index:number) => {
    // TODO: error occurs when picking a different ship when one of the ships is picked

    setPickedIndex(placedShips[index].shipIndex)
    setPlacedShips([
      ...placedShips.slice(0, index),
      ...placedShips.slice(index + 1),
    ])
  }

  const handleShipClick = (index:number) => {
    if (!isShipPlaced(index)) {
      setPickedIndex(index)
    }
  }

  const handleMouseOver = (index:number) => {
    if (pickedIndex === null) {
      return
    }

    const pickedShip = ships[pickedIndex]
    const hoveredCell = getPositionFromIndex(index, map.size)

    let isValid = true

    if (orientation === orientations.horizontal) {
      const cellsToRight = map.size - hoveredCell.x

      if (cellsToRight < pickedShip.length) {
        isValid = false
      }
    } 
    
    if (
      isValid && 
      orientation === orientations.vertical
    ) {
      const cellsToBottom = map.size - hoveredCell.y

      if (cellsToBottom < pickedShip.length) {
        isValid = false
      }
    }

    if (isValid) {
      for (let i = 0; i < placedShips.length; i++) {
        const placedShip = placedShips[i]

        if (placedShip.orientation === orientation) {
          if (orientation === orientations.horizontal) {
            // TODO: implement get ship line
            const ship1 = {
              x1: hoveredCell.x,
              y1: hoveredCell.y,
              x2: hoveredCell.x + pickedShip.length - 1,
              y2: hoveredCell.y,
            }
            const position = getPositionFromIndex(placedShip.cellIndex, map.size)
            // TODO: implement get ship line
            const ship2 = {
              x1: position.x,
              y1: position.y,
              x2: position.x + ships[placedShip.shipIndex].length - 1,
              y2: position.y,
            }

            if (ship1.y1 === ship2.y1) {
              if (
                (
                  ship2.x1 >= ship1.x1 &&
                  ship2.x1 <= ship1.x2
                ) || (
                  ship2.x2 >= ship1.x1 &&
                  ship2.x2 <= ship1.x2
                ) 
              ) {
                isValid = false
                break
              }
            }
          } else {
            // TODO: implement get ship line
            const ship1 = {
              x1: hoveredCell.x,
              y1: hoveredCell.y,
              x2: hoveredCell.x,
              y2: hoveredCell.y + pickedShip.length - 1,
            }
            const position = getPositionFromIndex(placedShip.cellIndex, map.size)
            // TODO: implement get ship line
            const ship2 = {
              x1: position.x,
              y1: position.y,
              x2: position.x,
              y2: position.y + ships[placedShip.shipIndex].length - 1,
            }

            if (ship1.x1 === ship2.x1) {
              if (
                (
                  ship2.y1 >= ship1.y1 &&
                  ship2.y1 <= ship1.y2
                ) || (
                  ship2.y2 >= ship1.y1 &&
                  ship2.y2 <= ship1.y2
                )
              ) {
                isValid = false
                break
              }
            }
          }
        } else {
          let horizontalShipCellIndex = null
          let horizontalShipWidth = null

          let verticalShipX = null
          let verticalShipY = null
          let verticalShipWidth = null

          if (
            placedShip.orientation === orientations.horizontal &&
            orientation === orientations.vertical
          ) {
            horizontalShipCellIndex = placedShip.cellIndex
            horizontalShipWidth = ships[placedShip.shipIndex].length

            verticalShipX = hoveredCell.x
            verticalShipY = hoveredCell.y
            verticalShipWidth = pickedShip.length
          } else {
            horizontalShipCellIndex = index
            horizontalShipWidth = pickedShip.length

            const shipPosition = getPositionFromIndex(placedShip.cellIndex, map.size)
            verticalShipX = shipPosition.x
            verticalShipY = shipPosition.y
            verticalShipWidth = ships[placedShip.shipIndex].length
          }

          // TODO: implement get ship line
          const horizontalLine = {
            p1: v2(),
            p2: v2(),
          }

          horizontalLine.p1 = getPositionFromIndex(horizontalShipCellIndex, map.size),
          horizontalLine.p2.x = horizontalLine.p1.x + (horizontalShipWidth - 1),
          horizontalLine.p2.y = horizontalLine.p1.y

          // TODO: implement get ship line
          const verticalLine = {
            p1: v2(),
            p2: v2(),
          }

          verticalLine.p1 = {
            x: verticalShipX,
            y: verticalShipY,
          }
          verticalLine.p2.x = verticalLine.p1.x
          verticalLine.p2.y = verticalLine.p1.y + (verticalShipWidth - 1)

          if (
            verticalLine.p1.x >= horizontalLine.p1.x && 
            verticalLine.p1.x <= horizontalLine.p2.x &&
            horizontalLine.p1.y >= verticalLine.p1.y && 
            horizontalLine.p1.y <= verticalLine.p2.y
          ) {
            isValid = false
            break
          } 
        }
      }
    }

    setIsPlacementValid(isValid)
    setHoveredIndex(index)
  }

  const handleClick = (index:number) => {
    if (
      hoveredIndex !== null && 
      pickedIndex !== null &&
      isPlacementValid
    ) {
      setPlacedShips([
        ...placedShips,
        {
          cellIndex: hoveredIndex,
          shipIndex: pickedIndex,
          orientation,
        },
      ])
      setPickedIndex(null)
    }
  }

  const submitPlacement = () => {
    if (gameMode !== gameModes.shipPlacement) {
      return
    }

    if (isPlacementComplete) {
      const args: {
        userId: string,
        ships: Array<{
          cellIndex: number,
          orientation: orientations,
          length: number,
        }>
      } = {
        userId,
        ships: placedShips.map(placedShip => {
          return {
            cellIndex: placedShip.cellIndex,
            orientation: placedShip.orientation,
            length: ships[placedShip.shipIndex].length,
          }
        }),
      }

      socket.emit(eventTypes.placeShips, args)
    }
  }

  return (
    <div className="mx-auto max-w-5xl py-6 flex">
      <div className="px-3 w-1/2">
        <div className="flex flex-wrap aspect-square relative overflow-hidden">
          {shipPreview && (
            <div
              className={classnames("absolute origin-bottom-left transition-all pointer-events-none", {
                "bg-blue-400": isPlacementValid,
                "bg-red-400": !isPlacementValid,
              })}
              style={{ ...shipPreview }}
            ></div>
          )}
          {placedShips.map((placedShip, index) => {
            const ship = ships[placedShip.shipIndex]
            const cellSize = 100 / map.size

            const { x, y } = getPositionFromIndex(placedShip.cellIndex, map.size)
            const transform = placedShip.orientation === orientations.vertical
              ? `translateY(-100%) rotate(90deg)`
              : "none"

            return (
              <div
                className="absolute origin-bottom-left bg-blue-400"
                style={{
                  width: `${cellSize * ship.length}%`,
                  height: `${cellSize}%`,
                  top: `${cellSize * y}%`,
                  left: `${cellSize * x}%`,
                  transform,
                }}
                key={index}
                onClick={() => handlePlacedShipClick(index)}
              ></div>
            )
          })}
          {map.cells.map((value, index) => {
            return (
              <div
                key={index}
                className="border border-gray-500 aspect-square"
                style={{
                  width: `${100 / map.size}%`,
                  fontSize: "12px",
                }}
                onMouseOver={() => handleMouseOver(index)}
                onClick={() => handleClick(index)}
              ></div>
            )
          })}
        </div>
      </div>
      <div className="px-3 w-1/2 relative">
        <div className="flex flex-wrap aspect-square relative">
          {ships.map((ship, index) => {
            const cellSize = 100 / map.size

            const x = orientation === orientations.horizontal ? ship.horizontal.x : ship.vertical.x
            const y = orientation === orientations.horizontal ? ship.horizontal.y : ship.vertical.y

            const transform = orientation === orientations.vertical
              ? `translateY(-100%) rotate(90deg)`
              : "none"

            const isPicked = pickedIndex === index

            return (
              <div
                className={classnames("absolute origin-bottom-left border-4 border-dashed", {
                  "border-transparent bg-blue-400": !isPicked,
                  "border-blue-500 bg-blue-200": isPicked,
                  "opacity-50": isShipPlaced(index),
                })}
                style={{
                  width: `${cellSize * ship.length}%`,
                  height: `${cellSize}%`,
                  top: `${cellSize * y}%`,
                  left: `${cellSize * x}%`,
                  transform,
                }}
                key={index}
                onClick={() => handleShipClick(index)}
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
          <div className="w-full absolute bottom-8 text-center">
            <button
              type="button"
              className="px-4 py-2 bg-gray-400 text-24 font-bold rounded-6"
              onClick={handleRotateClick}
            >
              Rotate
            </button>
            <button
              type="button"
              className={classnames("ml-8 px-4 py-2 bg-gray-400 text-24 font-bold rounded-6", {
                "opacity-50": !isPlacementComplete,
              })}
              onClick={submitPlacement}
            >
              Submit
            </button>
          </div>
          {(gameMode === gameModes.waitingForPlayer) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-36 text-white uppercase">
              Waiting for player
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const App = () => {
  const [gameMode, setGameMode] = useState<gameModes>(gameModes.shipPlacement)

  const mapSize = 10
  const initialMap = {
    size: mapSize,
    cells: Array(mapSize * mapSize).fill(0),
  }
  const [map, setMap] = useState<Map|null>({ ...initialMap })
  const [enemyMap, setEnemyMap] = useState<Map|null>({ ...initialMap })
  const [userId, setUserId] = useState(null)
  const [playerAlias, setPlayerAlias] = useState<playerAliases|null>(null)
  const [activePlayer, setActivePlayer] = useState<playerAliases|null>(null)
  const [winner, setWinner] = useState(null)
  console.log({ userId, playerAlias, activePlayer })

  const winnerDialogOpen = winner !== null

  const handleHit = (args: {
    index: number, 
    playerAlias: playerAliases,
    winner: playerAliases | null,
  }) => {
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
      setWinner(args.winner === playerAliases.p1 ? "1" : "2")
    }
  }

  const handleMiss = (args: {
    index: number,
    attacker: playerAliases,
    nextActivePlayer: playerAliases,
  }) => {
    const currentPlayer = playerAlias

    if (args.attacker === currentPlayer) {
      setEnemyMap({
        ...enemyMap,
        cells: [
          ...enemyMap.cells.slice(0, args.index),
          cellTypes.miss,
          ...enemyMap.cells.slice(args.index + 1),
        ],
      })
    } else {
      setMap({
        ...map,
        cells: [
          ...map.cells.slice(0, args.index),
          cellTypes.miss,
          ...map.cells.slice(args.index + 1),
        ],
      })
    }
    setActivePlayer(args.nextActivePlayer)
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

  const handleJoin = (data: JoinEventPayload) => {
    // setMap(data.map)
    // setEnemyMap(data.enemyMap)
    setPlayerAlias(data.playerAlias)
    // setActivePlayer(data.activePlayer)
  }

  const handleWaitForPlayer = () => {
    setGameMode(gameModes.waitingForPlayer)
  }

  const handleReadyForBattle = (args: {
    activePlayer: playerAliases,
  }) => {
    setGameMode(gameModes.battle)
    setActivePlayer(args.activePlayer)
  }

  const restart = () => {
    setMap({ ...initialMap })
    setEnemyMap({ ...initialMap })
    setPlayerAlias(null)
    setActivePlayer(null)
    setWinner(null)
    setGameMode(gameModes.shipPlacement)
  }

  useEffect(() => {
    socket.connect()

    socket.on(eventTypes.connect, handleConnect)
    socket.on(eventTypes.join, handleJoin)
    socket.on(eventTypes.waitForPlayer, handleWaitForPlayer)
    socket.on(eventTypes.readyForBattle, handleReadyForBattle)
    socket.on(eventTypes.disconnect, () => { console.log("disconnected") })

    socket.on(eventTypes.readyForBattle, (map) => {
      console.log("ready for battle")
      console.log(map)
    })

    return () => {
      socket.disconnect()

      socket.off(eventTypes.connect, handleConnect)
      socket.off(eventTypes.join, handleJoin)
      socket.off(eventTypes.waitForPlayer, handleWaitForPlayer)
      socket.off(eventTypes.readyForBattle, handleReadyForBattle)
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

  if (
    gameMode === gameModes.shipPlacement ||
    gameMode === gameModes.waitingForPlayer
  ) {
    return (
      <ShipPlacement
        map={map}
        userId={userId}
        gameMode={gameMode}
      />
    )
  }

  return (
    <>
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
      <Dialog
        open={winnerDialogOpen} 
        onClose={() => {}}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="max-w-lg bg-white p-12">
            <h1>Player {winner} wins!!</h1>
            <div className="text-center">
              <button
                type="button"
                onClick={restart}
                className="mt-4 px-4 py-2 border border-black"
              >
                Restart
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

createRoot(document.getElementById("app")).render(<App />)