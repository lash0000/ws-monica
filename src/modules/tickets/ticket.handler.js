const TicketServiceFactory = require("./ticket.srv");

module.exports = (io) => {
  const TicketService = TicketServiceFactory(io);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // -----------------------------
    // TICKETS - LIST ALL
    // -----------------------------
    socket.on("tickets:get_all", async (payload = {}) => {
      try {
        // payload could include filters/pagination if you want
        const tickets = await TicketService.getAll(payload);
        // emit only to requester
        socket.emit("tickets:list", tickets);
      } catch (err) {
        console.error("tickets:get_all error:", err.message);
        socket.emit("tickets:error", { action: "get_all", message: err.message });
      }
    });

    // -----------------------------
    // TICKETS - GET ONE
    // -----------------------------
    socket.on("tickets:get_one", async (ticket_id) => {
      try {
        const ticket = await TicketService.getOne(ticket_id);
        socket.emit("tickets:single", ticket);
      } catch (err) {
        console.error("tickets:get_one error:", err.message);
        socket.emit("tickets:error", { action: "get_one", message: err.message });
      }
    });

    // -----------------------------
    // TICKETS - CREATE
    // -----------------------------
    socket.on("tickets:create", async (payload) => {
      try {
        // payload: { title, description, created_by, ... }
        const created = await TicketService.create(payload);

        // echo to sender
        socket.emit("tickets:created", created);

        // broadcast to everyone else (global new ticket)
        socket.broadcast.emit("tickets:new", created);
      } catch (err) {
        console.error("tickets:create error:", err.message);
        socket.emit("tickets:error", { action: "create", message: err.message });
      }
    });

    // -----------------------------
    // TICKETS - UPDATE
    // -----------------------------
    socket.on("tickets:update", async ({ id, data }) => {
      try {
        const updated = await TicketService.update(id, data);

        // echo back to requester
        socket.emit("tickets:updated", updated);

        // broadcast update to others
        socket.broadcast.emit("tickets:updated", updated);

        // if ticket has room, notify that room specifically (optional)
        const room = `ticket_${id}`;
        socket.to(room).emit("tickets:updated", updated);
      } catch (err) {
        console.error("tickets:update error:", err.message);
        socket.emit("tickets:error", { action: "update", message: err.message });
      }
    });

    // -----------------------------
    // TICKETS - DELETE
    // -----------------------------
    socket.on("tickets:delete", async (ticket_id) => {
      try {
        await TicketService.delete(ticket_id);

        socket.emit("tickets:deleted", ticket_id);
        socket.broadcast.emit("tickets:deleted", ticket_id);

        // also notify the ticket room to let viewers know
        const room = `ticket_${ticket_id}`;
        socket.to(room).emit("tickets:deleted", ticket_id);
      } catch (err) {
        console.error("tickets:delete error:", err.message);
        socket.emit("tickets:error", { action: "delete", message: err.message });
      }
    });

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
    // FETCH ALL COMMENTS (for a ticket)
    // -----------------------------
    socket.on("tickets:comments:fetch_all", async (ticket_id) => {
      try {
        const comments = await TicketService.getAllComment(ticket_id);
        socket.emit("tickets:comments:list", comments);
      } catch (err) {
        console.error("tickets:comments:fetch_all error:", err.message);
        socket.emit("tickets:comments:error", { message: err.message });
      }
    });

    // -----------------------------
    // ADD NEW COMMENT (REALTIME + DB SAVE)
    // -----------------------------
    socket.on("tickets:comments:add", async (payload) => {
      try {
        console.log("[SOCKET] Incoming comment payload:", payload);

        // Accept both parent_id and ticket_id
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

        // 3. Broadcast to the ticket room (so only viewers of that ticket get it)
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
      try {
        const list = await TicketService.myComment(user_id);
        socket.emit("tickets:comments:my", list);
      } catch (err) {
        console.error("tickets:comments:by_user error:", err.message);
        socket.emit("tickets:comments:error", { message: err.message });
      }
    });

    // -----------------------------
    // DISCONNECT
    // -----------------------------
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};
