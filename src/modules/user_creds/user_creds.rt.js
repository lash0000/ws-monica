const express = require('express');
const router = express.Router();
const UserCredsController = require('./user_creds.ctrl');

module.exports = (io) => {
  const controller = new UserCredsController(io);

  router.post('/login', (req, res) => controller.login(req, res));
  router.post('/logout', (req, res) => controller.logout(req, res));

  return router;
};
