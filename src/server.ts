import { createServer } from 'http'
import express from 'express'
import { Server } from 'socket.io'
import cors from "cors"
import webHooksRouter from './routes/webhooks.js'
import meetingsRouter from './routes/meetings.js'
import { configDotenv } from 'dotenv'
import { authMiddleware } from './middleware/auth.js'
import { db } from './config/db.js'
import { corsOptions } from './config/corsConfig.js'

configDotenv()
const port = parseInt(process.env.PORT || '8000', 10)
const dev = process.env.NODE_ENV !== 'production'

const app = express()

app.use(express.json())

// CORS SETUP
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}))

const users: Record<string, IUser> = {};

export interface IUser {
  // peerId: string;
  roomId: string
  id: string;
  imageUrl: string
  username: string;
}


const server = createServer(app)

// Create WebSocket server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

io.on('connection', (socket) => {
  console.log("user connected", socket.id)

  socket.on('requestPrivateCallAccess', (data: {username: string, roomId: string, userId: string}) => {
    const { username, roomId, userId } = data
    socket.to(roomId).emit("requestMessage", {username, roomId, userId})
  })
  
  socket.on('acceptedPrivateCallAccess', (data: {roomId: string, userId: string}) => {
    const { roomId, userId } = data
    socket.to(roomId).emit("acceptedPrivateCallAccess", {userId})
  })

  socket.on('updateRoomType', async (data: {roomId: string, type: 'private' | 'public'}) => {
    const { roomId, type } = data
    await db.meeting.update({
      where: { callId: roomId },
      data: { type }
    })
    socket.to(roomId).emit("updateRoomType", {type})
  })

  socket.on('joinRoom', (roomId, user) => {
    socket.join(roomId);
    users[socket.id] = { username: user?.username, roomId, imageUrl: user?.imageUrl, id: user?.userId };
    io.to(roomId).emit('userJoined', users[socket.id]);
    io.to(roomId).emit('updateUserList', Object.values(users).filter(user => user.roomId === roomId));
  });

  socket.on('enableCamera', (userId, roomId) => {
    console.log('enableCam', userId, roomId)
    io.to(roomId).emit('enableCamera', userId);
  })

  socket.on('disableCamera', (userId, roomId) => {
    console.log('disableCam', userId, roomId)
    io.to(roomId).emit('disableCamera', userId);
  })

  socket.on('disableMicrophone', (userId, roomId) => {
    console.log('disableMicrophone', userId, roomId)
    io.to(roomId).emit('disableMicrophone', userId);
  })

  socket.on('enableMicrophone', (userId, roomId) => {
    console.log('enableMicrophone', userId, roomId)
    io.to(roomId).emit('enableMicrophone', userId);
  })
  
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      delete users[socket.id];
      io.to(user.roomId).emit('userLeft', { username: user.username });
      io.to(user.roomId).emit('updateUserList', Object.values(users).filter(u => u.roomId === user.roomId));
    }
    console.log("A user disconnected: ", socket.id);
  });

})

app.use(cors(corsOptions))

app.get("/", (_, res) => {
  res.json({message: "Server is running"})
})

app.use('/webhook', webHooksRouter)


app.use(authMiddleware)
app.use('/meetings', meetingsRouter)

app.all('*', (req, res) => {
  res.status(404).json({ message: "Route not found" })
})




// Start the server
server.listen(port, () => {
  console.log(`> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`)
})