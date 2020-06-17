const messageRouter = require('express').Router();
var jwt = require('jsonwebtoken');
const Chat = require('../models/chat');
const Message = require('../models/message');
const User = require('../models/user');

messageRouter.post('/', async (req, res) => {
  const body = req.body;

  const token = jwt.verify(req.token, process.env.SECRET)
  const user = await User.findById(token.id);
  console.log(token);
  console.log(body);
  console.log(user);

  if ( !body.message || !user || !body.chatID ) {
      return res.status(400).json({ error: 'content missing or invalid token' });
  };

  const message = new Message( {
      message: body.message,
      user: user._id,
      chat: body.chatID
  });

  message.save()
      .then(savedMessage => {
          res.json(savedMessage.toJSON())
      })
});

module.exports = messageRouter;