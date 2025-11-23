const TicketServiceFactory = require("./ticket.srv");

module.exports = (io) => {
  const TicketService = TicketServiceFactory(io);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // -----------------------------
    // JOIN ROOM
    // -----------------------------
    socket.on("tickets:join", (ticket_id) => {
      const room = `ticket_${ticket_id}`;
      socket.join(room);

      console.log(`[SOCKET] ${socket.id} joined room ${room}`);
    });

    // -----------------------------
    // LEAVE ROOM
    // -----------------------------
    socket.on("tickets:leave", (ticket_id) => {
      const room = `ticket_${ticket_id}`;
      socket.leave(room);

      console.log(`[SOCKET] ${socket.id} left room ${room}`);
    });

    // -----------------------------
    // FETCH COMMENTS
    // -----------------------------
    socket.on("tickets:comments:fetch_all", async (ticket_id) => {
      const comments = await TicketService.getAllComment(ticket_id);
      socket.emit("tickets:comments:list", comments);
    });

    // -----------------------------
    // ADD NEW COMMENT (REALTIME + DB SAVE)
    // -----------------------------
    socket.on("tickets:comments:add", async (payload) => {
      try {
        console.log("[SOCKET] New comment payload:", payload);

        // 1. Save to Database
        const newComment = await TicketService.addNewComment(payload);

        console.log("[SOCKET] Saved comment:", newComment);

        // 2. Emit back to sender
        socket.emit("tickets:comments:added", newComment);

        // 3. Emit to everyone else in the room
        const room = `ticket_${payload.ticket_id}`;
        socket.to(room).emit("tickets:comments:new", newComment);

      } catch (err) {
        console.error("Error saving comment:", err.message);
        socket.emit("tickets:comments:error", { message: err.message });
      }
    });

    // -----------------------------
    // MY COMMENTS (OPTIONAL)
    // -----------------------------
    socket.on("tickets:comments:by_user", async (user_id) => {
      const myComments = await TicketService.myComment(user_id);
      socket.emit("tickets:comments:my", myComments);
    });

    // -----------------------------
    // DISCONNECT
    // -----------------------------
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};
