module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("[SOCKET] Ticket module active:", socket.id);

    // Join a specific ticket room
    socket.on("ticket:join", (ticket_id) => {
      socket.join(`ticket:${ticket_id}`);
      console.log(`[SOCKET] Joined ticket room: ticket:${ticket_id}`);
    });

    // Leave a specific ticket room
    socket.on("ticket:leave", (ticket_id) => {
      socket.leave(`ticket:${ticket_id}`);
      console.log(`[SOCKET] Left ticket room: ticket:${ticket_id}`);
    });

    // Real-time comments from client → save → broadcast
    socket.on("ticket:comment:new", async (payload) => {
      try {
        const CommentService = require("../../comments/comment.srv");
        const service = new CommentService("ticket");

        const saved = await service.addNewComment(payload);

        // Broadcast only to users in same ticket room
        io.to(`ticket:${payload.parent_id}`).emit("ticket:comment:added", saved);

      } catch (err) {
        console.error("[SOCKET] Comment failed:", err.message);
        socket.emit("ticket:comment:error", { error: err.message });
      }
    });

    // Real-time local updates (for dashboards)
    socket.on("ticket:status:update", ({ ticket_id, status }) => {
      io.to(`ticket:${ticket_id}`).emit("ticket:status:changed", {
        ticket_id,
        status,
      });
    });

    // Optional typing indicator
    socket.on("ticket:typing", ({ ticket_id, user }) => {
      socket.broadcast.to(`ticket:${ticket_id}`).emit("ticket:typing", user);
    });
  });
};
