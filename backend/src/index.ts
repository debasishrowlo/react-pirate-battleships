import express, { Request, Response } from 'express'
import { createServer } from 'node:http'
import { Socket, Server } from 'socket.io'
const cors = require('cors')

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
  p1: string|null,
  p2: string|null,
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
    console.log("new user")
    state.users.push({
      id: userId,
      socketId: socketId,
    })
  }
}

const generateMap = ():Map => {
  const mapSize = 10
  const cellCount = mapSize * mapSize
  const map = {
    size: 10,
    cells: Array(cellCount).fill(0)
  }

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
    {
      cell: { x: 9, y: 0 },
      length: 3,
      orientation: orientations.vertical,
    },
    {
      cell: { x: 7, y: 5 },
      length: 4,
      orientation: orientations.vertical,
    },
  ]

  for (let i = 0; i < ships.length; i++) {
    const ship = ships[i]
    const cell = ship.cell

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

  // TODO: temp code
  map.cells[6] = 3
  map.cells[20] = 2

  return map
}

const generateOpponentMap = ():Map => {
  const mapSize = 10
  const cellCount = mapSize * mapSize
  const map = {
    size: 10,
    cells: Array(cellCount).fill(0)
  }

  map.cells[0] = 2
  map.cells[1] = 2
  map.cells[2] = 2

  map.cells[3] = 3
  map.cells[4] = 3
  map.cells[5] = 3

  return map
}

const broadcastMapsToSender = (
  io:Server, socket:Socket, 
  data:{
    map: Map,
    enemyMap: Map,
  }
) => {
  io.to(socket.id).emit("init", data);
}

const joinGame = (state:State, userId:string) => {
  if (state.p1 === null) {
    state.p1 = userId
  } else if (state.p2 === null) {
    if (userId !== state.p1) {
      state.p2 = userId
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

const main = () => {
  const state:State = {
    p1: null,
    p2: null,
    users: [],
  }

  io.on('connect', (socket: Socket) => {
    console.log('a user connected')

    socket.on("init", (args) => {
      const userId = args.userId

      addUserToUsersList(state, userId, socket.id)
      
      joinGame(state, userId)

      const data:{
        map: Map,
        enemyMap: Map,
      } = {
        map: generateMap(),
        enemyMap: generateOpponentMap(),
      }
      broadcastMapsToSender(io, socket, data)
    })

    socket.on("fire", (args) => {
      console.log(args)
    })

    socket.on('disconnect', () => {
      console.log('user disconnected')
      removeUserFromUsersList(state, socket)
    })
  })
}

main()

const port = 4000
server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`)
})