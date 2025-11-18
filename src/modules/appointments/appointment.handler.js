module.exports = (io, service) => {
  io.on("connection", (socket) => {
    console.log("client connected:", socket.id);

    socket.on("appointment:create", async (payload) => {
      try {
        const created = await service.createAppointment(payload);
        socket.emit("appointment:create:success", created);
      } catch (err) {
        socket.emit("appointment:create:error", err.message);
      }
    });

    socket.on("appointment:update", async ({ id, payload }) => {
      try {
        const updated = await service.updateAppointment(id, payload);
        socket.emit("appointment:update:success", updated);
      } catch (err) {
        socket.emit("appointment:update:error", err.message);
      }
    });

    socket.on("appointments:get", async (filters) => {
      try {
        const list = await service.getAppointments(filters);
        socket.emit("appointments:list", list);
      } catch (err) {
        socket.emit("appointments:error", err.message);
      }
    });

    socket.on("appointment:get", async (id) => {
      try {
        const result = await service.getAppointmentById(id);
        socket.emit("appointment:data", result);
      } catch (err) {
        socket.emit("appointment:get:error", err.message);
      }
    });
  });
};
