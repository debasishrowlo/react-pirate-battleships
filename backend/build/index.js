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
io.on('connect', (socket) => {
    console.log('a user connected');
    socket.on("fire", () => {
        console.log('under attack');
        // TODO: damage calculations
        io.emit("fire");
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
const port = 4000;
server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
});
