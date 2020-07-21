const chatRouter = require('express').Router();
var jwt = require('jsonwebtoken');
const Chat = require('../models/chat');
const User = require('../models/user');
const Message = require('../models/message');

const getLatestMessageTime = async (chatID) => {
  const chat = await Chat.findById(chatID).populate('messages');
  const latestTime = new Date(Math.max.apply(null, chat.messages.map((message) => {
    return new Date(message.time);
  })));
  return latestTime;
}

const initMessageNotification = (userID, messages) => {
  const check = messages.every(message => {
    return message.seen.some(user => {
      return user.equals(userID)
    })
  });
  return check ? '' : 'New messages!';
};

const markSeen = async (userID, messages) => {
  messages.forEach( async (msg) => {
    const message = await Message.findById(msg._id)
    const haveSeen = message.seen.some(user => {
      return user.equals(userID)
    })
    if (!haveSeen) {
      const updatedMessage = await Message.findByIdAndUpdate(msg._id, { $push: { seen: userID } }, {new: true});
    }
  });
  return true;
}

chatRouter.post('/', async (req, res) => {
  const body = req.body;
  if ( !body.title || !body.users) {
      return res.status(400).json({ error: 'content missing' });
  };

  try {
    const token = jwt.verify(req.token, process.env.SECRET)
    const user = await User.findById(token.id);

    const users = await User.find({}).where('username').in(body.users).select('_id');
    const userIDs = users.map(obj => obj._id);

    const chat = new Chat( {
        creator: user._id,
        title: body.title,
        users: userIDs.concat(user._id),
        messages: []
    });

    chat.save()
        .then(savedChat => {
            res.json({id: savedChat._id, title: savedChat.title, latestMessage: null})
        })
  } catch {
    res.status(400).json({ error: 'something went wrong' });
  }
});

chatRouter.get('/', async (req, res) => {
  try {
    const token = jwt.verify(req.token, process.env.SECRET)
    const user = await User.findById(token.id);

    const chats = await Chat.find({}).where('users').in([user._id])
    .populate({ 
      path: 'messages', populate: [
        { path: 'user', select: 'username' },
        { path: 'seen', select: 'username' }]}
    )

    const chatsWithTimes = await Promise.all(chats.map( async (chat) => ({
        id: chat._id, title: chat.title, latestMessage: await getLatestMessageTime(chat._id), messageNotification: initMessageNotification(user._id, chat.messages)
    })))
    res.json(chatsWithTimes);
  } catch {
    res.status(400).json({ error: 'something went wrong' });
  }
})

chatRouter.get('/:id/:numOfMessages', async (req, res) => {
  try {
    const token = jwt.verify(req.token, process.env.SECRET)
    const user = await User.findById(token.id);
    const chat = await Chat.findById(req.params.id)
    .populate([{ 
      path: 'messages', populate: [
        { path: 'user', select: 'username' },
        { path: 'seen', select: 'username' }]},
        { path: 'creator', select: 'username' },
        { path: 'users', select: 'username' },
    ])

    await markSeen(user._id.toString(), chat.messages);

    // Getting only the next 50 messages from the chat
    chat.messages = chat.messages.reverse().slice(0, req.params.numOfMessages + 50).reverse();
    res.json(chat);

  } catch (error) {
    console.log(error)
    res.status(400).json({ error: 'something went wrong' });
  }
})

chatRouter.post('/:id', async (req, res) => {
  const body = req.body;
  const chatID = req.params.id

  try {
    const token = jwt.verify(req.token, process.env.SECRET)
    const user = await User.findById(token.id);
    
    if (!body.message) {
        return res.status(400).json({ error: 'content missing' });
    };
    
    const message = new Message( {
        message: body.message,
        user: user._id,
        seen: [user._id],
    })

    await Chat.findByIdAndUpdate(chatID, { $push: { messages: message } }, {new: true});
    message.save((err, newMessage) => {
      Message.populate(newMessage, [{path: 'user', select: 'username'}, { path: 'seen', select: 'username'}])
      .then(populatedMessage => {
        res.json(populatedMessage.toJSON())
      })
    })
  } catch {
    res.status(400).json({ error: 'something went wrong' });
  }
});

chatRouter.delete('/chat/:id', async (req, res) => {
  try {
    const chatID = req.params.id

    const token = jwt.verify(req.token, process.env.SECRET)
    const user = await User.findById(token.id);

    const updatedChat = await Chat.findByIdAndUpdate(chatID, { $pullAll: { users: [ user._id]}}, {new: true})
    const ID = updatedChat._id

    if ( updatedChat.users.length === 0) {
      updatedChat.messages.forEach( async (msg) => {
        await Message.findByIdAndRemove(msg._id);
      })
      updatedChat.remove();
    }

    res.json({chatID: ID});
  } catch {
    res.status(400).json({ error: 'something went wrong' });
  }
})

chatRouter.post('/user/:id', async (req, res) => {

  const username = req.body.username;
  const chatID = req.params.id

  if ( !username ) {
    return res.status(400).json({ error: 'content missing' });
  };

  try {
    jwt.verify(req.token, process.env.SECRET)
    const user = await User.findOne({username: username}).select('username');
    await Chat.findByIdAndUpdate(chatID, { $push: { users: user } }, {new: true});

    res.json(user);
  } catch {
    res.status(400).json({ error: 'something went wrong' });
  }
});


module.exports = chatRouter;