const TicketServiceFactory = require("./ticket.srv");

class TicketController {
  constructor(io) {
    this.io = io;
    this.TicketService = TicketServiceFactory(io);
  }

  createTicket = async (req, res) => {
    try {
      const result = await this.TicketService.createTicket(req);
      res.status(201).json(result);
      setTimeout(() => {
        this.sendTicketCreationEmail(result.ticket);
      }, 10);

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  getAllTickets = async (req, res) => {
    try {
      res.json(await this.TicketService.getAllTickets());
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  TicketGetById = async (req, res) => {
    try {
      res.json(await this.TicketService.getTicketById(req.params.id));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  myTickets = async (req, res) => {
    try {
      const user_id = req.params.id;
      const tickets = await this.TicketService.MyTickets(user_id);
      res.json(tickets);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  myTicketsStatus = async (req, res) => {
    try {
      const user_id = req.params.id;
      const tickets = await this.TicketService.MyCountTickets(user_id);
      res.json(tickets);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  myBlotterTicketsStatus = async (req, res) => {
    try {
      const user_id = req.params.id;
      const tickets = await this.TicketService.MyCountBlotterByStatus(user_id);
      res.json(tickets);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  updateTicket = async (req, res) => {
    try {
      const result = await this.TicketService.updateTicket(req);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  // Comment side 
  addComment = async (req, res) => {
    try {
      const result = await this.TicketService.addNewComment({
        parent_id: req.params.id,
        commented_by: req.body.commented_by,
        comment: req.body.comment
      });

      const room = `ticket:${req.params.id}`;

      this.io.to(room).emit("ticket:comment:added", result);
      this.io.emit("ticket:comment:added", result);

      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  myComments = async (req, res) => {
    try {
      const comments = await this.TicketService.myComment(req.params.user_id);
      res.json(comments);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  getAllComments = async (req, res) => {
    try {
      const result = await this.TicketService.getAllComment(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  getCommentByID = async (req, res) => {
    try {
      const result = await this.TicketService.getCommentByID(req.params.commentId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  deleteTicket = async (req, res) => {
    try {
      const result = await this.TicketService.deleteTicket(req);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  countBlotter = async (req, res) => {
    try {
      const count = await this.TicketService.countBlotterTicket();
      res.json({ count });
    } catch (error) {
      res.status(500).json({
        message: "Failed to count blotter tickets",
        error: error.message
      });
    }
  }

  myCountBlotterTickets = async (req, res) => {
    try {
      const user_id = req.params.id;
      const tickets = await this.TicketService.MyCountBlotter(user_id);
      res.json(tickets);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

}

module.exports = TicketController;
