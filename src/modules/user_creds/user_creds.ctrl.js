const userCredsService = require('./user_creds.srv');
const UserSessions = require('../user_sessions/user_sessions.mdl');
const { broadcastSessionUpdate } = require('../../utils/realtime.utils');
const { Op } = require('sequelize');

class UserCredsController {
  /**
   * POST /api/v1/user-creds/verify
   * Verifies session validity using session_id
   */
  async verify(req, res) {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: 'Missing session_id in request body' });
      }

      const { session } = await userCredsService.f_validateSession(sessionId);

      // Compute remaining lifetime (days left)
      const createdAt = new Date(session.createdAt);
      const now = new Date();
      const msLeft = createdAt.getTime() + 15 * 24 * 60 * 60 * 1000 - now.getTime();
      const daysLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24)));

      return res.status(200).json({
        message: 'Session verified successfully',
        session_id: session.session_id,
        user_id: session.user_id,
        createdAt: session.createdAt,
        daysLeft,
      });
    } catch (error) {
      return res.status(401).json({
        message: error.message || 'Session verification failed',
      });
    }
  }

  /**
   * POST /api/v1/user-creds/logout
   * Ends a user session and broadcasts real-time update
   */
  async logout(req, res) {
    try {
      const { session_id } = req.body;
      if (!session_id) {
        return res.status(400).json({ message: 'Missing session_id in request body' });
      }

      // Mark session as logged out
      await UserSessions.update(
        {
          logout_date: new Date(),
          logout_info: 'User logged out',
        },
        { where: { session_id } }
      );

      // Get fresh active session count
      const activeCount = await UserSessions.count({
        where: {
          logout_date: { [Op.is]: null },
          logout_info: { [Op.is]: null },
        },
      });

      // Broadcast to all connected Socket.IO clients
      const io = req.app.get('io');
      if (io) {
        broadcastSessionUpdate(io, activeCount);
      }

      return res.status(200).json({
        message: 'Logout successful. Session ended.',
        active_sessions: activeCount,
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        message: 'Logout failed.',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/v1/user-creds/login
   * Optional: triggers real-time broadcast on new login
   */
  async login(req, res) {
    try {
      const { user_id } = req.body;
      if (!user_id) {
        return res.status(400).json({ message: 'Missing user_id in request body' });
      }

      await UserSessions.create({
        user_id,
        login_date: new Date(),
      });

      const activeCount = await UserSessions.count({
        where: {
          logout_date: { [Op.is]: null },
          logout_info: { [Op.is]: null },
        },
      });

      const io = req.app.get('io');
      if (io) {
        broadcastSessionUpdate(io, activeCount);
      }

      return res.status(200).json({
        message: 'Login successful. Session created.',
        active_sessions: activeCount,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Login failed.',
        error: error.message,
      });
    }
  }
}

module.exports = new UserCredsController();
