var jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authRouter = require('express').Router();
const User = require('../models/user');

// Create a new user
authRouter.post('/signup', (req, res) => {
  const body = req.body;
  console.log(body);

  if (!body.username || !body.email || !body.password) {
      return res.status(400).json({ error: 'content missing' });
  };

  const saltRounds = 10;
  const hash = bcrypt.hashSync(body.password, saltRounds);

  const user = new User( {
      username: body.username,
      email: body.email,
      password: hash
  });

  user.save()
      .then(savedUser => {
          res.json(savedUser.toJSON())
      })
});

// Login
authRouter.post('/login', async (req, res) => {
  const body = req.body;
  const username = body.username

  const user = await User.findOne({ username });
  const passwordCorrect = user === null ? false : await bcrypt.compare(body.password, user.password);

  if (!(user && passwordCorrect)) {
    return res.status(401).json({
      error: 'invalid username or password'
    });
  };

  const userToken = {
    username: username,
    id: user._id,
  };

  const token = jwt.sign(userToken, process.env.SECRET);
  res.status(200).send({ token, username});
});

// Get list of all the users
authRouter.get('/', async (req, res) => {
  const token = jwt.verify(req.token, process.env.SECRET)
  const users = await User.find({}).select('username');

  res.status(200).send(users);
});

// Update user's last login
authRouter.post('/', async (req, res) => {

  const token = jwt.verify(req.token, process.env.SECRET)
  if ( !token ) {
      return res.status(400).json({ error: 'invalid token' });
  };

  console.log(token.id)

  const user = await User.findByIdAndUpdate(token.id, { lastLogin: Date.now() }, {new: true});

  console.log(user)
  res.json(user.toJSON())
});

module.exports = authRouter;