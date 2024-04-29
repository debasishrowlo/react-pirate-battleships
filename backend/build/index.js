"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_http_1 = require("node:http");
const socket_io_1 = require("socket.io");
const cors = require('cors');
const app = (0, express_1.default)();
app.use(cors({
    origin: 'http://localhost:3000', // TODO: disable CORS for production
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
const server = (0, node_http_1.createServer)(app);
const io = new socket_io_1.Server(server);
app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});
// type User = {
//   socketId: string,
//   id: string,
// }
// const users:User[] = []
io.on('connect', (socket) => {
    console.log('a user connected');
    socket.on("init", (args) => {
        // const existingUserIndex = users.findIndex(user => user.id === args.userId)
        // const userExists = existingUserIndex !== -1
        // if (userExists) {
        //   users[existingUserIndex].socketId = socket.id
        // } else {
        //   users.push({
        //     id: args.userId,
        //     socketId: socket.id,
        //   })
        // }
        const mapSize = 10;
        const cellCount = mapSize * mapSize;
        const map = {
            size: 10,
            cells: Array(cellCount).fill(0)
        };
        const orientations = {
            horizontal: "horizontal",
            vertical: "vertical",
        };
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
        ];
        for (let i = 0; i < ships.length; i++) {
            const ship = ships[i];
            const cell = ship.cell;
            if (ship.orientation === orientations.horizontal) {
                for (let j = 0; j < ship.length; j++) {
                    const index = cell.y * mapSize + cell.x;
                    map.cells[index] = 1;
                    cell.x += 1;
                }
            }
            else {
                for (let j = 0; j < ship.length; j++) {
                    const index = cell.y * mapSize + cell.x;
                    map.cells[index] = 1;
                    cell.y += 1;
                }
            }
        }
        io.to(socket.id).emit("init", map);
    });
    socket.on("fire", (args) => {
        console.log(args);
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
const port = 4000;
server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
});
