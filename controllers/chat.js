const chatRouter = require('express').Router();
var jwt = require('jsonwebtoken');
const Chat = require('../models/chat');
const User = require('../models/user');
const Message = require('../models/message');
const chat = require('../models/chat');

const getLatestMessageTime = async (chatID) => {
  const chat = await Chat.findById(chatID).populate('messages');
  const latestTime = new Date(Math.max.apply(null, chat.messages.map((message) => {
    return new Date(message.time);
  })));
  return latestTime;
}

chatRouter.post('/', async (req, res) => {
  const body = req.body;
  const token = jwt.verify(req.token, process.env.SECRET)
  const user = await User.findById(token.id);

  if ( !body.title || !user ) {
      return res.status(400).json({ error: 'content missing or invalid token' });
  };

  const chat = new Chat( {
      creator: user._id,
      title: body.title,
      users: [user._id],
      messages: []
  });

  chat.save()
      .then(savedChat => {
          res.json(savedChat.toJSON())
      })
});

chatRouter.get('/', async (req, res) => {

  const token = jwt.verify(req.token, process.env.SECRET)
  const user = await User.findById(token.id);

  if ( !user ) {
    return res.status(400).json({ error: 'Invalid token' });
  };

  const chats = await Chat.find({}).where('users').in([user._id]).select('title');
  const chatsWithTimes = await Promise.all(chats.map( async (chat) => ({id: chat._id, title: chat.title, latestMessage: await getLatestMessageTime(chat._id) })))

  res.json(chatsWithTimes);
})

chatRouter.get('/:id', async (req, res) => {

  const token = jwt.verify(req.token, process.env.SECRET)
  const chat = await Chat.findById(req.params.id)
  .populate([{ 
    path: 'messages', populate:
      { path: 'user', select: 'username' }},
      { path: 'creator', select: 'username' },
      { path: 'users', select: 'username' },
  ])

  res.json(chat);
})

chatRouter.post('/:id', async (req, res) => {
  const body = req.body;
  const chatID = req.params.id
  
  const token = jwt.verify(req.token, process.env.SECRET)
  const user = await User.findById(token.id);
  
  if ( !body.message || !user ) {
      return res.status(400).json({ error: 'content missing or invalid token' });
  };
  
  const message = new Message( {
      message: body.message,
      user: user._id,
  })

  const chat = await Chat.findByIdAndUpdate(chatID, { $push: { messages: message } }, {new: true});
  if(!chat || !chat.users.includes(user._id)) {
    return res.status(400).json({ error: 'something went wrong' });
  }

  message.save((err, newMessage) => {
    Message.populate(newMessage, {path: 'user', select: 'username'})
    .then(populatedMessage => {
      res.json(populatedMessage.toJSON())
    })
  })
});

chatRouter.post('/user/:id', async (req, res) => {
  console.log(req.params.id);
  console.log(req.body);

  const body = req.body;
  const chatID = req.params.id

  const token = jwt.verify(req.token, process.env.SECRET)
  const user = await User.findOne({username: body.username}).select('username');

  if ( !chatID || !user ) {
      return res.status(400).json({ error: 'something went wrong' });
  };

  const chat = await Chat.findByIdAndUpdate(chatID, { $push: { users: user } }, {new: true});

  res.json(user);
});


module.exports = chatRouter;