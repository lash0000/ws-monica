const TicketServiceFactory = require("./ticket.srv");

module.exports = (io) => {
  const TicketService = TicketServiceFactory(io);

  io.on("connection", (socket) => {
    // Join a room (from client)
    socket.on("tickets:join", (ticket_id) => {
      if (!ticket_id) return;
      socket.join(`ticket:${ticket_id}`);
      // optional: send current comments for the ticket to the joiner
      // TicketService.getAllComment(ticket_id).then(list => {
      //   socket.emit("tickets:comments:list", list)
      // })
    });

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

    // Add new comment: persist via service, populate full user info, then broadcast to room
    socket.on("tickets:comments:add", async (payload) => {
      /*
        payload expected shape (client should send):
        {
          parent_id: "<ticket id>",
          category: "ticket",
          commented_by: "<user id>",
          comment: "I am root."
        }
      */
      try {
        // ensure the sender is in the room (so they receive broadcasts)
        if (payload && payload.parent_id) {
          socket.join(`ticket:${payload.parent_id}`);
        }

        // Persist the comment
        const created = await TicketService.addNewComment(payload);
        if (!created || !created.id) {
          socket.emit("tickets:error", { action: "comment:add", error: "Failed to create comment" });
          return;
        }

        // Fetch the populated comment (with UserCredential/UserProfile) so clients receive full data
        let populated = created;
        try {
          populated = await TicketService.getCommentByID(created.id);
        } catch (err) {
          // if population fails, continue with created (less ideal)
          populated = created;
        }

        // Send to the sender
        socket.emit("tickets:comments:added", populated);

        // Broadcast to room (everyone in ticket room). Using io.to ensures both sender and others in the room get it.
        io.to(`ticket:${payload.parent_id}`).emit("tickets:comments:new", populated);
      } catch (err) {
        socket.emit("tickets:error", {
          action: "comment:add",
          error: err.message
        });
      }
    });

    // Fetch all comments made by a specific user
    socket.on("tickets:comments:by_user", async (user_id) => {
      const myComments = await TicketService.myComment(user_id);
      socket.emit("tickets:comments:my", myComments);
    });

    // optional: handle disconnect
    socket.on("disconnect", (reason) => {
      // console.log("socket disconnected", socket.id, reason);
    });
  });
};
