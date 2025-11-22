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
      try {
        if (!ticket_id) return;
        socket.join(`ticket:${ticket_id}`);
        console.info(`socket ${socket.id} joined ticket:${ticket_id}`);
      } catch (err) {
        console.warn("join room error", err?.message);
      }
    });

    socket.on("tickets:leave", (ticket_id) => {
      try {
        if (!ticket_id) return;
        socket.leave(`ticket:${ticket_id}`);
        console.info(`socket ${socket.id} left ticket:${ticket_id}`);
      } catch (err) {
        console.warn("leave room error", err?.message);
      }
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
      try {
        if (!payload || !payload.parent_id || !payload.comment || !payload.commented_by) {
          return socket.emit("tickets:error", { action: "comments:add", payload, error: "Missing fields" });
        }

        // Add comment through service (persist)
        const newComment = await TicketService.addNewComment(payload);

        // confirm to the sender
        socket.emit("tickets:comments:added", newComment);

        // broadcast to everyone in the ticket room (including sender)
        io.to(`ticket:${payload.parent_id}`).emit("tickets:comments:new", newComment);

        // also send to general listeners if needed
        io.emit("tickets:comment:global", { ticket_id: payload.parent_id, comment: newComment });
      } catch (err) {
        socket.emit("tickets:error", { action: "comments:add", payload, error: err.message });
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
