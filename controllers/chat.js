const chatRouter = require('express').Router();
var jwt = require('jsonwebtoken');
const Chat = require('../models/chat');
const User = require('../models/user');
const Message = require('../models/message');

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

  const chats = await Chat.find({}).where('users').in([user._id]).select({'title': 1});
  res.json(chats.map(chat => chat.toJSON()))
})

chatRouter.get('/:id', async (req, res) => {

  const token = jwt.verify(req.token, process.env.SECRET)
  const chat = await Chat.findById(req.params.id)
  .populate({ 
     path: 'messages',
     populate: {
       path: 'user',
       select: { username: 1 }
     }
  })

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
      chat: chatID
  });

  const chat = await Chat.findByIdAndUpdate(chatID, { $push: { messages: message } }, {new: true});
  
  message.save()
      .then(savedMessage => {
          res.json(savedMessage.toJSON())
      })
});


module.exports = chatRouter;