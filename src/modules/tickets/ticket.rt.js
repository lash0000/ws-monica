const express = require("express");
const TicketController = require("./ticket.ctrl");

module.exports = (io) => {
  const router = express.Router();
  const controller = new TicketController(io);
  const f_authMiddleware = require('../../middlewares/auth.mw');

  // Ticket creation
  router.post("/", f_authMiddleware, (req, res) =>
    controller.createTicket(req, res)
  );
  router.get("/", f_authMiddleware, (req, res) =>
    controller.getAllTickets(req, res)
  );
  router.get("/blotter", f_authMiddleware, (req, res) =>
    controller.countBlotter(req, res)
  );
  router.get("/blotter/user/:id", f_authMiddleware, (req, res) =>
    controller.myCountBlotterTickets(req, res)
  );
  router.get("/:id", f_authMiddleware, (req, res) =>
    controller.TicketGetById(req, res)
  );
  router.patch("/:id", f_authMiddleware, (req, res) =>
    controller.updateTicket(req, res)
  );
  router.delete('/:id', f_authMiddleware, (req, res) =>
    controller.deleteTicket(req, res)
  );
  router.get("/user/:id", f_authMiddleware, (req, res) =>
    controller.myTickets(req, res)
  );
  router.get("/user/status/:id", f_authMiddleware, (req, res) =>
    controller.myTicketsStatus(req, res)
  );
  router.get("/user/blotter/status/:id", f_authMiddleware, (req, res) =>
    controller.myBlotterTicketsStatus(req, res)
  );
  
  //all counts per category


  // Comments (requries id)
  router.post("/:id/comments", f_authMiddleware, (req, res) =>
    controller.addComment(req, res)
  );

  router.get("/:id/comments", f_authMiddleware, (req, res) =>
    controller.getAllComments(req, res)
  );

  router.get("/comment/:commentId", f_authMiddleware, (req, res) =>
    controller.getCommentByID(req, res)
  );

  router.get("/user/:user_id/comments", f_authMiddleware, (req, res) =>
    controller.myComments(req, res)
  );


  return router;
};
