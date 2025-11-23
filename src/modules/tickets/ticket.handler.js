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
    // FETCH ALL COMMENTS
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
        console.log("[SOCKET] Incoming comment payload:", payload);

        // FIX: Accept both parent_id and ticket_id
        const parent_id = payload.parent_id || payload.ticket_id;

        if (!parent_id) {
          console.log("[SOCKET] Missing parent_id/ticket_id in payload");
          return socket.emit("tickets:comments:error", {
            message: "Missing parent_id or ticket_id"
          });
        }

        // 1. Save to database
        const newComment = await TicketService.addNewComment({
          parent_id,
          commented_by: payload.commented_by,
          comment: payload.comment
        });

        console.log("[SOCKET] Comment saved:", newComment?.id);

        // 2. Emit back to sender
        socket.emit("tickets:comments:added", newComment);

        // 3. Broadcast to room
        const room = `ticket_${parent_id}`;
        socket.to(room).emit("tickets:comments:new", newComment);

      } catch (err) {
        console.error("Error saving comment:", err.message);
        socket.emit("tickets:comments:error", { message: err.message });
      }
    });

    // -----------------------------
    // GET COMMENTS BY USER
    // -----------------------------
    socket.on("tickets:comments:by_user", async (user_id) => {
      const list = await TicketService.myComment(user_id);
      socket.emit("tickets:comments:my", list);
    });

    // -----------------------------
    // DISCONNECT
    // -----------------------------
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};
