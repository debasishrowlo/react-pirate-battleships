import express, { Request, Response } from 'express'
import { createServer } from 'node:http'
import { Socket, Server } from 'socket.io'
const cors = require('cors')

import { 
  JoinEventPayload,
  cellTypes, 
  eventTypes, 
  orientations, 
  playerAliases,
} from "./shared/types"
import {
  getPositionFromIndex,
  getIndexFromPosition, 
} from "./shared/utils"

const app = express()
app.use(cors({
  origin: 'http://localhost:3000', // TODO: disable CORS for production
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}))

const server = createServer(app)
const io = new Server(server)

app.get('/', (req: Request, res: Response) => {
  res.send('<h1>Hello world</h1>')
})

type User = {
  socketId: string,
  id: string,
}

type State = {
  p1: {
    id: string|null,
    map: Map|null,
  },
  p2: {
    id: string|null,
    map: Map|null,
  },
  turn: playerAliases,
  users: User[],
}

type Map = {
  size: number,
  cells: number[],
}

const addUserToUsersList = (state:State, userId:string, socketId: string) => {
  const existingUserIndex = state.users.findIndex(user => user.id === userId)
  const userExists = existingUserIndex !== -1

  if (userExists) {
    state.users[existingUserIndex].socketId = socketId
  } else {
    state.users.push({
      id: userId,
      socketId: socketId,
    })
  }
}

const generateMap = (ships:Ship[], mapSize:number):Map => {
  const cellCount = mapSize * mapSize
  const map = {
    size: mapSize,
    cells: Array(cellCount).fill(0),
  }

  for (let i = 0; i < ships.length; i++) {
    const ship = ships[i]
    const cell = getPositionFromIndex(ship.cellIndex, map.size)

    if (ship.orientation === orientations.horizontal) {
      for (let j = 0; j < ship.length; j++) {
        const index = cell.y * mapSize + cell.x
        map.cells[index] = 1
        cell.x += 1
      }
    } else {
      for (let j = 0; j < ship.length; j++) {
        const index = cell.y * mapSize + cell.x
        map.cells[index] = 1
        cell.y += 1
      }
    }
  }

  return map
}

const generateOpponentMap = ():Map => {
  const mapSize = 10
  const cellCount = mapSize * mapSize
  const map = {
    size: 10,
    cells: Array(cellCount).fill(0)
  }

  map.cells[0] = cellTypes.ship
  map.cells[1] = cellTypes.ship
  map.cells[2] = cellTypes.ship
  map.cells[3] = cellTypes.ship
  map.cells[4] = cellTypes.ship

  return map
}

const removeShips = (map:Map):Map => {
  return {
    ...map,
    cells: map.cells.map(value => {
      if (value === cellTypes.ship) {
        return cellTypes.empty
      }

      return value
    })
  }
}

const broadcastMapsToSender = (
  io:Server, socket:Socket, 
  data:{
    map: Map,
    enemyMap: Map,
  }
) => {
  io.to(socket.id).emit(eventTypes.join, data)
}

const joinGame = (state:State, userId:string) => {
  if (state.p1.id === null) {
    state.p1.id = userId
  } else if (state.p2.id === null) {
    if (userId !== state.p1.id) {
      state.p2.id = userId
    } else {
      // TODO: join as spectator
    }
  }
}

const removeUserFromUsersList = (state:State, socket:Socket) => {
  const userIndex = state.users.findIndex(user => user.socketId === socket.id)
  state.users = [
    ...state.users.slice(0, userIndex),
    ...state.users.slice(userIndex + 1),
  ]
}

const handleJoin = (
  args: {
    userId: string,
    socket: Socket,
  },
  state: State,
  socket: Socket,
) => {
  const userId = args.userId

  addUserToUsersList(state, userId, socket.id)
  
  joinGame(state, userId)

  // let map = null
  // let enemyMap = null
  let playerAlias = null

  const isPlayer1 = userId === state.p1.id

  if (isPlayer1) {
    // map = state.p1.map
    // enemyMap = state.p2.map
    playerAlias = playerAliases.p1
  } else {
    // map = state.p2.map
    // enemyMap = state.p1.map
    playerAlias = playerAliases.p2
  }

  // if (map === null || enemyMap === null) {
  //   throw new Error("Empty map")
  // }

  // const payload:{
  //   map: Map,
  //   enemyMap: Map,
  //   playerAlias: playerAliases,
  //   activePlayer: playerAliases,
  // } = {
  //   map,
  //   enemyMap: removeShips(enemyMap),
  //   playerAlias,
  //   activePlayer: state.turn,
  // }

  // broadcastMapsToSender(io, socket, payload)

  const payload:JoinEventPayload = { playerAlias }

  io.to(socket.id).emit(eventTypes.join, payload)
}

const handleFire = (
  args: {
    index: number,
    userId: string,
  },
  state: State,
) => {
  let activePlayer = null
  let activePlayerKey = null
  let enemyPlayer = null
  let enemyPlayerKey:playerAliases|null = null

  if (state.turn === playerAliases.p1) {
    activePlayer = state.p1
    activePlayerKey = playerAliases.p1
    enemyPlayer = state.p2
    enemyPlayerKey = playerAliases.p2
  } else {
    activePlayer = state.p2
    activePlayerKey = playerAliases.p2
    enemyPlayer = state.p1
    enemyPlayerKey = playerAliases.p1
  }

  const sentByActivePlayer = args.userId === activePlayer.id
  console.log({
    userId: args.userId,
    activePlayerId: activePlayer.id,
    p1Id: state.p1.id,
    p2Id: state.p2.id,
  })

  if (!sentByActivePlayer) {
    return
  }

  const attackedIndex = args.index
  if (enemyPlayer.map === null) {
    throw new Error("Empty map")
  }
  const attackedCellContainsShip = enemyPlayer.map.cells[attackedIndex] === cellTypes.ship

  const enemyMap = state[enemyPlayerKey].map
  if (enemyMap === null) {
    throw new Error("Empty map")
  }

  if (attackedCellContainsShip) {
    enemyMap.cells[args.index] = cellTypes.damagedShip

    const payload:{
      index: number,
      playerAlias: playerAliases,
      winner: playerAliases | null,
    } = {
      index: args.index,
      playerAlias: enemyPlayerKey,
      winner: null,
    }

    const enemyDefeated = enemyMap.cells.every(value => value !== 1)

    if (enemyDefeated) {
      payload.winner = state.turn
    }

    io.emit(eventTypes.hit, payload)
  } else {
    enemyMap.cells[args.index] = cellTypes.miss
    state.turn = enemyPlayerKey

    io.emit(eventTypes.miss, {
      index: args.index,
      attacker: activePlayerKey,
      nextActivePlayer: enemyPlayerKey,
    })
  }
}

const handleDisconnect = (state:State, socket:Socket) => {
  removeUserFromUsersList(state, socket)
}

const handlePlaceShips = (
  args: {
    userId: string,
    ships: Array<{
      cellIndex: number,
      orientation: orientations,
      length: number,
    }>,
  },
  state:State,
  socket:Socket,
) => {
  // TODO: verify ships has 5 ships
  // TODO: verify ships has 1 ship with width 5
  // TODO: verify ships has 1 ship with width 4
  // TODO: verify ships has 2 ships with width 3
  // TODO: verify ships has 1 ship with width 2
  // TODO: verify ships placements are valid

  // TODO: generate a map out of the received ships

  const map = generateMap(args.ships, 10)

  let currentPlayer:"p1"|"p2"|null = null
  let otherPlayer:"p1"|"p2"|null = null

  if (args.userId === state.p1.id) {
    currentPlayer = "p1"
    otherPlayer = "p2"
  } else {
    currentPlayer = "p2"
    otherPlayer = "p1"
  }

  state[currentPlayer].map = map

  if (state[otherPlayer].map === null) {
    socket.emit(eventTypes.waitForPlayer)
  } else {
    const activePlayer = Math.random() < 0.5
      ? playerAliases.p1
      : playerAliases.p2
    state.turn = activePlayer
    io.emit(eventTypes.readyForBattle, { activePlayer })
  }
}

type Ship = {
  cellIndex: number,
  length: number,
  orientation: orientations,
}

const initState = ():State => {
  const mapSize = 10
  const ships = [
    {
      cellIndex: getIndexFromPosition(0, 0, mapSize),
      length: 5,
      orientation: orientations.horizontal,
    },
    {
      cellIndex: getIndexFromPosition(0, 2, mapSize),
      length: 3,
      orientation: orientations.horizontal,
    },
    {
      cellIndex: getIndexFromPosition(3, 5, mapSize),
      length: 3,
      orientation: orientations.horizontal,
    },
    {
      cellIndex: getIndexFromPosition(9, 0, mapSize),
      length: 3,
      orientation: orientations.vertical,
    },
    {
      cellIndex: getIndexFromPosition(7, 5, mapSize),
      length: 4,
      orientation: orientations.vertical,
    },
  ]

  const p1Map = generateMap(ships, mapSize)

  return {
    p1: {
      id: null,
      map: null
    },
    p2: {
      id: null,
      // map: generateOpponentMap(),
      map: null,
    },
    turn: playerAliases.p1,
    users: [],
  }
}

const main = () => {
  const state:State = initState()

  io.on(eventTypes.connect, (socket: Socket) => {
    socket.on(eventTypes.join, (args) => handleJoin(args, state, socket))
    socket.on(eventTypes.disconnect, () => handleDisconnect(state, socket))

    socket.on(eventTypes.placeShips, (args) => handlePlaceShips(args, state, socket))

    socket.on(eventTypes.fire, (args) => handleFire(args, state))
  })
}

main()

const port = 4000
server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`)
})