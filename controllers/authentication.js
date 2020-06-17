var jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authRouter = require('express').Router();
const User = require('../models/user');

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

module.exports = authRouter;