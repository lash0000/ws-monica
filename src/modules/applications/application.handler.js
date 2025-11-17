module.exports = (io, service) => {
  io.on("connection", (socket) => {

    socket.on("applications:fetch_all", async () => {
      try {
        const apps = await service.getAllApplications();
        socket.emit("applications:list", { success: true, data: apps });
      } catch (err) {
        socket.emit("applications:error", { success: false, message: err.message });
      }
    });

    socket.on("applications:fetch_one", async (id) => {
      try {
        const app = await service.getApplicationById(id);
        socket.emit("applications:one", { success: true, data: app });
      } catch (err) {
        socket.emit("applications:error", { success: false, message: err.message });
      }
    });

  });
};
