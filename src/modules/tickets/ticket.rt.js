const express = require("express");
const TicketController = require("./ticket.ctrl");

module.exports = (io) => {
  const router = express.Router();
  const controller = new TicketController(io);
  const f_authMiddleware = require('../../middlewares/auth.mw');

  router.post("/", f_authMiddleware, (req, res) =>
    controller.createTicket(req, res)
  );
  router.get("/", f_authMiddleware, (req, res) =>
    controller.getAllTickets(req, res)
  );
  router.get("/:id", f_authMiddleware, (req, res) =>
    controller.TicketGetById(req, res)
  );
  router.patch("/:id", f_authMiddleware, (req, res) =>
    controller.updateTicket(req, res)
  );

  return router;
};
