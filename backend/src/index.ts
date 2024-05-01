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

const state:State = {
  p1: null,
  p2: null,
  users: [],
}

const connectUser = (userId:string, socketId: string) => {
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

io.on('connect', (socket: Socket) => {
  console.log('a user connected')

  socket.on("init", (args) => {
    const userId = args.userId

    connectUser(userId, socket.id)

    // check and connect to player 1
    if (state.p1 === null) {
      state.p1 = userId
    }
    
    // check and connect to player 2
    if (
      state.p2 === null &&
      userId !== state.p1 &&
    ) {
      state.p2 = userId
    }

    // create the map
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

    // add ships to the map
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

    // broadcast to sender with the map
    io.to(socket.id).emit("init", map);

    console.log(state)
  })

  socket.on("fire", (args) => {
    console.log(args)
  })

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
})

const port = 4000
server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`)
})