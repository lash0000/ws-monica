const TicketServiceFactory = require("./ticket.srv");

class TicketController {
  constructor(io) {
    this.TicketService = TicketServiceFactory(io);
  }

  createTicket = async (req, res) => {
    try {
      const result = await this.TicketService.createTicket(req);
      res.status(201).json(result);
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

  updateTicket = async (req, res) => {
    try {
      const result = await this.TicketService.updateTicket(req);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
}

module.exports = TicketController;
