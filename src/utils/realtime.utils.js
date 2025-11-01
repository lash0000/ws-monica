module.exports = {
  broadcastSessionUpdate: (io, count) => {
    io.emit('server:heartbeat', {
      timestamp: new Date().toISOString(),
      activeDBSessions: count,
    });
  },
};
