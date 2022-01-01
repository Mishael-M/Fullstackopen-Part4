const bcrypt = require('bcryptjs');
const usersRouter = require('express').Router();
const User = require('../models/user');
const logger = require('../utils/logger');

usersRouter.post('/', async (request, response, next) => {
  const body = request.body;
  const password = body.password;
  // Validates length of username/password
  const bodyArray = [body.username, body.password];
  const lengths = bodyArray.filter((body) => body.length < 3);
  if (lengths.length > 0) {
    try {
      throw {
        name: 'ValidationUserError',
        message: 'Invalid username/password',
      };
    } catch (e) {
      next(e);
    }
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(body.password, saltRounds);

  const user = new User({
    username: body.username,
    name: body.name,
    passwordHash,
  });

  const savedUser = await user.save();

  response.json(savedUser);
});

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('blogs', {
    author: 1,
    title: 1,
  });
  response.json(users);
});

module.exports = usersRouter;
