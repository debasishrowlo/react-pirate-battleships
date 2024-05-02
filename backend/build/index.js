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
const addUserToUsersList = (state, userId, socketId) => {
    const existingUserIndex = state.users.findIndex(user => user.id === userId);
    const userExists = existingUserIndex !== -1;
    if (userExists) {
        state.users[existingUserIndex].socketId = socketId;
    }
    else {
        state.users.push({
            id: userId,
            socketId: socketId,
        });
    }
};
const generateMap = () => {
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
    return map;
};
const player1Joined = (state) => {
    return state.p1 !== null;
};
const joinAsPlayer1 = (state, userId) => {
    state.p1 = userId;
};
const player2Joined = (state) => {
    return state.p2 !== null;
};
const joinAsPlayer2 = (state, userId) => {
    if (userId !== state.p1) {
        state.p2 = userId;
    }
};
const broadcastMapToSender = (io, socket, map) => {
    io.to(socket.id).emit("init", map);
};
const main = () => {
    const state = {
        p1: null,
        p2: null,
        users: [],
    };
    io.on('connect', (socket) => {
        console.log('a user connected');
        socket.on("init", (args) => {
            const userId = args.userId;
            addUserToUsersList(state, userId, socket.id);
            const map = generateMap();
            if (!player1Joined(state)) {
                joinAsPlayer1(state, userId);
            }
            else if (!player2Joined(state)) {
                joinAsPlayer2(state, userId);
            }
            broadcastMapToSender(io, socket, map);
        });
        socket.on("fire", (args) => {
            console.log(args);
        });
        socket.on('disconnect', () => {
            console.log('user disconnected');
            // TODO: Remove user from users list when user is disconnected
            console.log(state);
        });
    });
};
main();
const port = 4000;
server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
});
