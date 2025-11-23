const TicketServiceFactory = require("./ticket.srv");

module.exports = (io) => {
  const TicketService = TicketServiceFactory(io);

  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    // -------------------------------
    // JOIN TICKET ROOM
    // -------------------------------
    socket.on("tickets:join", (ticket_id) => {
      const room = `ticket_${ticket_id}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined ${room}`);
    });

    // -------------------------------
    // LEAVE TICKET ROOM
    // -------------------------------
    socket.on("tickets:leave", (ticket_id) => {
      const room = `ticket_${ticket_id}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left ${room}`);
    });

    // -------------------------------
    // FETCH ALL COMMENTS
    // -------------------------------
    socket.on("tickets:comments:fetch_all", async (ticket_id) => {
      const comments = await TicketService.getAllComment(ticket_id);
      socket.emit("tickets:comments:list", comments);
    });

    // -------------------------------
    // ADD COMMENT + BROADCAST
    // -------------------------------
    socket.on("tickets:comments:add", async (payload) => {
      const saved = await TicketService.addNewComment(payload);

      const room = `ticket_${payload.ticket_id}`;

      // Send back to sender
      socket.emit("tickets:comments:added", saved);

      // Broadcast to everyone else in that same ticket room
      socket.to(room).emit("tickets:comments:new", saved);
    });

    // -------------------------------
    // TYPING INDICATOR (OPTIONAL)
    // -------------------------------
    socket.on("tickets:typing", (payload) => {
      const room = `ticket_${payload.ticket_id}`;
      socket.to(room).emit("tickets:typing", {
        user_id: payload.user_id,
        isTyping: true,
      });
    });

    socket.on("tickets:stop_typing", (payload) => {
      const room = `ticket_${payload.ticket_id}`;
      socket.to(room).emit("tickets:stop_typing", {
        user_id: payload.user_id,
        isTyping: false,
      });
    });

    socket.on("disconnect", () => {
      console.log(`Disconnected: ${socket.id}`);
    });
  });
};
