"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const webhooks_js_1 = __importDefault(require("./routes/webhooks.js"));
const meetings_js_1 = __importDefault(require("./routes/meetings.js"));
const dotenv_1 = require("dotenv");
const auth_js_1 = require("./middleware/auth.js");
const db_js_1 = require("./config/db.js");
const corsConfig_js_1 = require("./config/corsConfig.js");
(0, dotenv_1.configDotenv)();
const port = parseInt(process.env.PORT || '8000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = (0, express_1.default)();
app.use(express_1.default.json());
// CORS SETUP
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST"]
}));
const users = {};
const server = (0, http_1.createServer)(app);
// Create WebSocket server
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
io.on('connection', (socket) => {
    console.log("user connected", socket.id);
    socket.on('requestPrivateCallAccess', (data) => {
        const { username, roomId, userId } = data;
        socket.to(roomId).emit("requestMessage", { username, roomId, userId });
    });
    socket.on('acceptedPrivateCallAccess', (data) => {
        const { roomId, userId } = data;
        socket.to(roomId).emit("acceptedPrivateCallAccess", { userId });
    });
    socket.on('updateRoomType', async (data) => {
        const { roomId, type } = data;
        await db_js_1.db.meeting.update({
            where: { callId: roomId },
            data: { type }
        });
        socket.to(roomId).emit("updateRoomType", { type });
    });
    socket.on('joinRoom', (roomId, user) => {
        socket.join(roomId);
        users[socket.id] = { username: user?.username, roomId, imageUrl: user?.imageUrl, id: user?.userId };
        io.to(roomId).emit('userJoined', users[socket.id]);
        io.to(roomId).emit('updateUserList', Object.values(users).filter(user => user.roomId === roomId));
    });
    socket.on('enableCamera', (userId, roomId) => {
        console.log('enableCam', userId, roomId);
        io.to(roomId).emit('enableCamera', userId);
    });
    socket.on('disableCamera', (userId, roomId) => {
        console.log('disableCam', userId, roomId);
        io.to(roomId).emit('disableCamera', userId);
    });
    socket.on('disableMicrophone', (userId, roomId) => {
        console.log('disableMicrophone', userId, roomId);
        io.to(roomId).emit('disableMicrophone', userId);
    });
    socket.on('enableMicrophone', (userId, roomId) => {
        console.log('enableMicrophone', userId, roomId);
        io.to(roomId).emit('enableMicrophone', userId);
    });
    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            delete users[socket.id];
            io.to(user.roomId).emit('userLeft', { username: user.username });
            io.to(user.roomId).emit('updateUserList', Object.values(users).filter(u => u.roomId === user.roomId));
        }
        console.log("A user disconnected: ", socket.id);
    });
});
app.use((0, cors_1.default)(corsConfig_js_1.corsOptions));
app.get("/", (_, res) => {
    res.json({ message: "Server is running" });
});
app.use('/webhook', webhooks_js_1.default);
app.use(auth_js_1.authMiddleware);
app.use('/meetings', meetings_js_1.default);
app.all('*', (req, res) => {
    res.status(404).json({ message: "Route not found" });
});
// Start the server
server.listen(port, () => {
    console.log(`> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`);
});
