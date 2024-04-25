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

io.on('connect', (socket: Socket) => {
  console.log('a user connected')

  socket.on("fire", () => {
    console.log('under attack')
    // TODO: damage calculations

    io.emit("fire")
  })

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
})

const port = 4000
server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`)
})