const TicketServiceFactory = require("./ticket.srv");
const EmailTemplate = require('../../utils/email_template.utils');
const { sendEmail } = require('../../utils/nodemailer.utils');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');

class TicketController {
  constructor(io) {
    this.TicketService = TicketServiceFactory(io);
  }

  createTicket = async (req, res) => {
    try {
      const result = await this.TicketService.createTicket(req);

      // Respond immediately
      res.status(201).json(result);

      // This part of controller will look right after the results initiated
      // Busboy only concerns to File strategy otherwise all unrelated things will not WORK.
      // I put it here instead.
      setImmediate(async () => {
        try {
          const ticket = result.ticket;
          const credentials = await mdl_UserCredentials.findOne({
            where: { user_id: ticket.user_id },
            attributes: ["email"]
          });

          const recipientEmail = credentials?.email;
          if (!recipientEmail) {
            console.warn("[TicketController] No email found for user:", ticket.user_id);
            return;
          }

          const { html, subject } = await EmailTemplate.as_renderAll("tickets", {
            user: credentials,
            ticket,
            subject: "A new ticket issued sa ating Barangay Online Platform."
          });

          await sendEmail({
            to: recipientEmail,
            subject,
            html
          });

          console.log("[TicketController] Ticket email sent to:", recipientEmail);

        } catch (emailErr) {
          console.error("[TicketController] Email failed:", emailErr);
        }
      });

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
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

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

}

module.exports = TicketController;
