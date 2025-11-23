const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const UserCredsController = require('./user_creds.ctrl');

module.exports = (io) => {
  const controller = new UserCredsController(io);
  const f_authMiddleware = require('../../middlewares/auth.mw');

  router.use(cookieParser());
  router.post('/login', (req, res) => controller.login(req, res));
  router.post('/logout', (req, res) => controller.logout(req, res));
  router.post('/refresh', (req, res) => controller.refresh(req, res));
  router.post('/validate', (req, res) => controller.validate(req, res));

  // protected routes
  router.get("/all-users", f_authMiddleware, (req, res) =>
    controller.allCredentials(req, res)
  );

  return router;
};
