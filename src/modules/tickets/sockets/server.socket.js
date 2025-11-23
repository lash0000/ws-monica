module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`[SOCKET] Connected: ${socket.id}`);

    // Optional: join user-specific rooms
    socket.on("user:join", (user_id) => {
      socket.join(`user:${user_id}`);
      console.log(`[SOCKET] User joined room user:${user_id}`);
    });

    socket.on("user:leave", (user_id) => {
      socket.leave(`user:${user_id}`);
      console.log(`[SOCKET] User left room user:${user_id}`);
    });

    // Simple RTT check for debugging
    socket.on("client:ping", (data, callback) => {
      callback({ pong: true });
    });

    socket.on("disconnect", (reason) => {
      console.log(`[SOCKET] Disconnected: ${socket.id} (${reason})`);
    });
  });
};
