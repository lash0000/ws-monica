const express = require('express');
const router = express.Router();

module.exports = (io) => {
  const userCredsRoutes = require('../modules/user_creds/user_creds.rt')(io);
  const f_authMiddleware = require('../middlewares/auth.mw');

  router.use('/user-creds', userCredsRoutes);
  return router;
};
