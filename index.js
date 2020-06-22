require('dotenv').config();
const cors = require('cors');
const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const authRouter = require('./controllers/authentication');
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
const io = socketio(server);

io.on('connection', (socket) => {
  console.log("new connection");

  socket.on('disconnect', () => {
    console.log("User has left");
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});