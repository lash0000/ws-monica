const userCredsService = require('./user_creds.srv');

module.exports = (io, socket) => {
  socket.on('user_creds:verify', async (data = {}, callback = () => { }) => {
    try {
      const { sessionId } = data;
      if (!sessionId) {
        return callback({ success: false, message: 'Session ID required' });
      }

      const { session } = await userCredsService.f_validateSession(sessionId);

      return callback({
        success: true,
        message: 'Session verified successfully',
        session_id: session.session_id,
        user_id: session.user_id,
        createdAt: session.createdAt,
      });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });
};
