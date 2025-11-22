const TicketServiceFactory = require("./ticket.srv");

module.exports = (io) => {
  const TicketService = TicketServiceFactory(io);

  io.on("connection", (socket) => {
    socket.on("tickets:heartbeat", (payload) => {
      socket.emit("tickets:heartbeat", { ok: true, ts: payload?.ts || Date.now() });
    });

    // join room for a specific ticket (ticket:{id})
    socket.on("tickets:join", (ticket_id) => {
      if (!ticket_id) return;
      socket.join(`ticket:${ticket_id}`);
    });

    socket.on("tickets:leave", (ticket_id) => {
      if (!ticket_id) return;
      socket.leave(`ticket:${ticket_id}`);
    });

    socket.on("tickets:fetch_all", async () => {
      try {
        const list = await TicketService.getAllTickets();
        socket.emit("tickets:list", list);
      } catch (err) {
        socket.emit("tickets:error", { action: "fetch_all", error: err.message });
      }
    });

    socket.on("tickets:refresh_one", async (id) => {
      try {
        const one = await TicketService.getTicketById(id);
        socket.emit("tickets:one", one);
      } catch (err) {
        socket.emit("tickets:error", { action: "refresh_one", id, error: err.message });
      }
    });

    // COMMENTS
    socket.on("tickets:comments:fetch_all", async (ticket_id) => {
      try {
        const comments = await TicketService.getAllComment(ticket_id);
        socket.emit("tickets:comments:list", comments);
      } catch (err) {
        socket.emit("tickets:error", { action: "comments:fetch_all", ticket_id, error: err.message });
      }
    });

    // add comment via socket (payload must contain parent_id/category/comment/commented_by)
    socket.on("tickets:comments:add", async (payload) => {
      try {
        const newComment = await TicketService.addNewComment(payload);

        // confirm to the sender
        socket.emit("tickets:comments:added", newComment);

        // broadcast to everyone in the ticket room (including sender)
        io.to(`ticket:${payload.parent_id}`).emit("tickets:comments:new", newComment);
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
      // cleanup if needed
    });
  });
};
