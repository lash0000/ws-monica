const express = require('express');
const router = express.Router();

module.exports = (io) => {
  const userCredsRoutes = require('../modules/user_creds/user_creds.rt')(io);
  const userFileRoutes = require('../modules/files/files.rt')(io);
  const userTickets = require('../modules/tickets/ticket.rt')(io);
  const userProfile = require('../modules/user_profile/user_profile.rt')(io);
  const userApplications = require('../modules/applications/application.rt')(io);
  const userAppointments = require('../modules/appointments/appointment.rt')(io);
  const userEvents = require('../modules/events/event.rt')(io);

  router.use('/user-creds', userCredsRoutes);
  router.use('/files', userFileRoutes);
  router.use('/tickets', userTickets);
  router.use('/profile', userProfile);
  router.use('/applications', userApplications);
  router.use('/appointments', userAppointments);
  router.use('/events', userEvents);

  return router;
};
