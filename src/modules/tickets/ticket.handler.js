const TicketServiceFactory = require("./ticket.srv");

module.exports = (io) => {
  const TicketService = TicketServiceFactory(io);

  io.on("connection", (socket) => {
    console.info("ticket.handler: new socket connected", socket.id);

    // heartbeat test (client can send with ts)
    socket.on("tickets:heartbeat", (payload) => {
      try {
        socket.emit("tickets:heartbeat", { ok: true, ts: payload?.ts || Date.now() });
      } catch (err) {
        console.warn("heartbeat error", err?.message);
      }
    });

    // join/leave specific ticket room
    socket.on("tickets:join", (ticket_id) => {
      console.log("🟢 client joined:", socket.id, "room:", `ticket:${ticket_id}`);
      socket.join(`ticket:${ticket_id}`);
    });

    socket.on("tickets:leave", (ticket_id) => {
      console.log("🔴 client left:", socket.id, "room:", `ticket:${ticket_id}`);
      socket.leave(`ticket:${ticket_id}`);
    });

    // fetch all tickets
    socket.on("tickets:fetch_all", async () => {
      try {
        const list = await TicketService.getAllTickets();
        socket.emit("tickets:list", list);
      } catch (err) {
        socket.emit("tickets:error", { action: "fetch_all", error: err.message });
      }
    });

    // fetch one ticket
    socket.on("tickets:refresh_one", async (id) => {
      try {
        const one = await TicketService.getTicketById(id);
        socket.emit("tickets:one", one);
      } catch (err) {
        socket.emit("tickets:error", { action: "refresh_one", id, error: err.message });
      }
    });

    // COMMENTS
    // fetch comments (REST-like via socket)
    socket.on("tickets:comments:fetch_all", async (ticket_id) => {
      try {
        const comments = await TicketService.getAllComment(ticket_id);
        socket.emit("tickets:comments:list", comments);
      } catch (err) {
        socket.emit("tickets:error", { action: "comments:fetch_all", ticket_id, error: err.message });
      }
    });

    // Add comment via socket (payload must contain parent_id, category, comment, commented_by)
    socket.on("tickets:comments:add", async (payload) => {
      console.log("🟠 NEW COMMENT received:", payload);

      try {
        // Step 1 → create comment
        const created = await TicketService.addNewComment(payload);
        console.log("🟣 SAVED comment:", created);

        // Step 2 → fetch full joined comment
        const fullComment = await mdl_Comments.findOne({
          where: { id: created.id },
          include: [
            { model: mdl_Tickets, as: "Ticket_Details" },
            {
              model: mdl_UserCredentials,
              as: "UserCredential",
              include: [{ model: mdl_UserProfile, as: "UserProfile" }]
            },
            { model: mdl_UserProfile, as: "UserProfile" }
          ]
        });

        // Step 3 → emit full joined object
        socket.emit("tickets:comments:added", fullComment);
        console.log("🟢 emitted to sender (full comment)");

        io.to(`ticket:${payload.parent_id}`).emit("tickets:comments:new", fullComment);
        console.log("🔵 broadcast to room:", `ticket:${payload.parent_id}`);

      } catch (err) {
        console.log("❌ ERROR in add:", err);
      }
    });
    // fetch comments by user
    socket.on("tickets:comments:by_user", async (user_id) => {
      try {
        const myComments = await TicketService.myComment(user_id);
        socket.emit("tickets:comments:my", myComments);
      } catch (err) {
        socket.emit("tickets:error", { action: "comments:by_user", user_id, error: err.message });
      }
    });

    socket.on("disconnect", (reason) => {
      console.info(`socket ${socket.id} disconnected:`, reason);
      // cleanup if needed
    });
  });
};
