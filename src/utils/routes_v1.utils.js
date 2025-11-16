const express = require('express');
const router = express.Router();

module.exports = (io) => {
  const userCredsRoutes = require('../modules/user_creds/user_creds.rt')(io);
  const userFileRoutes = require('../modules/files/files.rt')(io);
  const userTickets = require('../modules/tickets/ticket.rt')(io);

  router.use('/user-creds', userCredsRoutes);
  router.use('/files', userFileRoutes);
  router.use('/tickets', userTickets);
  return router;
};
