module.exports = (io, service) => {
  io.on("connection", (socket) => {
    console.log("client connected:", socket.id);

    socket.on("CREATE_EVENT", async (data, callback) => {
      try {
        const event = await service.createEvent(data);
        callback({ success: true, event });
      } catch (err) {
        callback({ success: false, message: err.message });
      }
    });

    socket.on("UPDATE_EVENT", async (data, callback) => {
      try {
        // Expecting: { id: "<UUID>", payload: {...fields...} }
        const { id, payload } = data;

        if (!id) {
          return callback({
            success: false,
            message: "Missing event ID for update"
          });
        }

        const updated = await service.updateEvent(id, payload);
        callback({ success: true, event: updated });
      } catch (err) {
        callback({ success: false, message: err.message });
      }
    });
  });
};
