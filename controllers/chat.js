const chatRouter = require('express').Router();
var jwt = require('jsonwebtoken');
const Chat = require('../models/chat');
const User = require('../models/user');

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
      users: [user._id]
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

  const chats = await Chat.find({}).where('users').in([user._id]);
  res.json(chats.map(chat => chat.toJSON()))
})


module.exports = chatRouter;