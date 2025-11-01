const userCredsService = require('./user_creds.srv');
const UserSessions = require('../user_sessions/user_sessions.mdl');
const { broadcastSessionUpdate } = require('../../utils/realtime.utils');

module.exports = (io, socket) => {
  // Session verification
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

  socket.on('user_creds:login', async (data = {}, callback = () => { }) => {
    try {
      const { user_id } = data;
      if (!user_id) {
        return callback({ success: false, message: 'User ID required' });
      }

      await UserSessions.create({ user_id, login_date: new Date() });

      const activeCount = await UserSessions.count({
        where: { logout_date: null, logout_info: null },
      });

      broadcastSessionUpdate(io, activeCount);

      callback({
        success: true,
        message: 'Login session recorded successfully.',
        active_sessions: activeCount,
      });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });

  socket.on('user_creds:logout', async (data = {}, callback = () => { }) => {
    try {
      const { session_id } = data;
      if (!session_id) {
        return callback({ success: false, message: 'Session ID required for logout' });
      }

      await UserSessions.update(
        {
          logout_date: new Date(),
          logout_info: 'User logged out',
        },
        { where: { session_id } }
      );

      const activeCount = await UserSessions.count({
        where: { logout_date: null, logout_info: null },
      });

      // Realtime broadcast
      broadcastSessionUpdate(io, activeCount);

      callback({
        success: true,
        message: 'Logout successful. Session ended.',
        active_sessions: activeCount,
      });
    } catch (err) {
      callback({ success: false, message: err.message });
    }
  });
};
