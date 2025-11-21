const TicketServiceFactory = require("./ticket.srv");

module.exports = (io) => {
  const TicketService = TicketServiceFactory(io);

  io.on("connection", (socket) => {
    socket.on("tickets:fetch_all", async () => {
      socket.emit("tickets:list", await TicketService.getAllTickets());
    });

    socket.on("tickets:refresh_one", async (id) => {
      socket.emit("tickets:one", await TicketService.getTicketById(id));
    });

    socket.on("tickets:delete", async (ticket_id) => {
      try {
        const result = await TicketService.deleteTicket({ params: { id: ticket_id } });
        socket.emit("tickets:deleted", result);
        socket.broadcast.emit("tickets:deleted", result);
      } catch (err) {
        socket.emit("tickets:error", {
          action: "delete",
          ticket_id,
          error: err.message
        });
      }
    });

    // -----------------------------
    // COMMENTS (for tickets)
    // -----------------------------

    // Fetch all comments for a ticket
    socket.on("tickets:comments:fetch_all", async (ticket_id) => {
      const comments = await TicketService.getAllComment(ticket_id);
      socket.emit("tickets:comments:list", comments);
    });

    // Refresh comments for one ticket
    socket.on("tickets:comments:refresh", async (ticket_id) => {
      const comments = await TicketService.getAllComment(ticket_id);
      socket.emit("tickets:comments:updated", comments);
    });

    // Fetch a single comment
    socket.on("tickets:comments:one", async (comment_id) => {
      const comment = await TicketService.getCommentByID(comment_id);
      socket.emit("tickets:comments:detail", comment);
    });

    // Add new comment through sockets (optional)
    socket.on("tickets:comments:add", async (payload) => {
      const newComment = await TicketService.addNewComment(payload);
      socket.emit("tickets:comments:added", newComment);

      // Broadcast to other users
      socket.broadcast.emit("tickets:comments:new", newComment);
    });

    // Fetch all comments made by a specific user
    socket.on("tickets:comments:by_user", async (user_id) => {
      const myComments = await TicketService.myComment(user_id);
      socket.emit("tickets:comments:my", myComments);
    });
  });
};
