const express = require('express');
const EventController = require('./event.ctrl');

module.exports = (io) => {
  const router = express.Router();
  const controller = new EventController(io);
  const f_authMiddleware = require('../../middlewares/auth.mw');

  router.post("/", f_authMiddleware, (req, res) =>
    controller.createEvent(req, res)
  );
  router.get("/user/:id", f_authMiddleware, (req, res) =>
    controller.getAllMyEvents(req, res)
  );
  router.get("/:id", f_authMiddleware, (req, res) =>
    controller.getEventById(req, res)
  );
  router.get("/", f_authMiddleware, (req, res) =>
    controller.getAllEvents(req, res)
  );
  router.patch("/:id", f_authMiddleware, (req, res) =>
    controller.updateEvent(req, res)
  );

  return router;
};
