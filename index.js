require('dotenv').config();

const cors = require('cors');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Message = require('./models/message');

const authRouter = require('./controllers/authenticate');
const chatRouter = require('./controllers/chat');

const app = express();

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    request.token = authorization.substring(7)
  }
  next()
}

app.use(cors());
app.use(express.json());
app.use(tokenExtractor)
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);

const server = http.createServer(app);
io = socketio(server);

io.on('connection', (socket) => {
  console.log("new connection");
  socket.on('subscribe', (chats) => {
    socket.join(chats);
  });

  socket.on('message', async ( { messageID, chatID }) => {
    const message = await Message.findById(messageID).populate({path: 'user', select: 'username'})
    socket.broadcast.to(chatID).emit('new-message', { message: message.toJSON(), chatID });
  })

  socket.on('disconnect', () => {
    console.log("User has left");
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});