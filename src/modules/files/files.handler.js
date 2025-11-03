module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`[socket:files] connected: ${socket.id}`);

    socket.on('files:upload_start', (data) => {
      socket.emit('files:upload_status', {
        message: `Starting upload for ${data.filename}...`,
      });
    });

    socket.on('disconnect', () => {
      console.log(`[socket:files] disconnected: ${socket.id}`);
    });
  });
};
