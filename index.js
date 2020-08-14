require('dotenv').config();

const cors = require('cors');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Message = require('./models/message');
const Chat = require('./models/chat');
const helpers = require('./helpers');

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

const server = http.createServer(app);
io = socketio(server);

app.use(cors());
app.use(express.json());
app.use(tokenExtractor)
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/loggedUsers', async (req, res) => {
  const loggedUsers = await helpers.findLoggedUsers(io);
  res.status(200).send(loggedUsers.map((user) => user.username));
});

io.on('connection', async (socket) => {
  const loggedUsers = await helpers.findLoggedUsers(io);
  socket.on('subscribe', async (params) => {
    const chatIDs = params[0].chatIDs;
    const username = params[0].username;
    socket.username = username;
    socket.join('loggedUsers');

    const users = await helpers.findLoggedUsers(io);
    io.in('loggedUsers').emit('user-logged', users);
    socket.join(chatIDs);
  });

  socket.on('message', async ( { messageID, chatID }) => {
    const message = await Message.findById(messageID).populate([{path: 'user', select: 'username'}, {path: 'seen', select: 'username'}])
    socket.broadcast.to(chatID).emit('new-message', { message: message.toJSON(), chatID });
  })

  socket.on('add-user', async ( { socketID, chatID }) => {
    const chat = await Chat.findById(chatID)
    io.to(socketID).emit('new-chat', { id: chat._id, title: chat.title, latestMessage: null });
  })

  socket.on('join-chat', async ( { chatID }) => {
    socket.join(chatID);
  })

  socket.on('leave-chat', async ( { chatID }) => {
    socket.leave(chatID);
  })

  socket.on('disconnect', async () => {
    const users = await helpers.findLoggedUsers(io);
    socket.broadcast.to('loggedUsers').emit('user-left', users);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});