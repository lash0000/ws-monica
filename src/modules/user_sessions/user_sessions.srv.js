const jwt = require('jsonwebtoken');
const UserSessionsModel = require('./user_sessions.mdl');

class UserSessionsService {
  constructor() {
    this.sessionModel = UserSessionsModel;
    this.f_findBySessionId = this.f_findBySessionId.bind(this);
    this.f_verifyRefreshToken = this.f_verifyRefreshToken.bind(this);
  }

  /**
   * Finds a session by its session_id.
   * Throws if not found or logged out.
   */
  async f_findBySessionId(sessionId) {
    try {
      const session = await this.sessionModel.findOne({
        where: { session_id: String(sessionId) },
      });

      if (!session) throw new Error('Session not found');
      if (session.logout_date !== null) throw new Error('Session ended — user logged out');

      return session;
    } catch (err) {
      throw new Error(`Failed to find session: ${err.message}`);
    }
  }

  /**
   * Verify a JWT refresh token (optional, can be used later)
   */
  f_verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token has expired');
      }
      throw new Error('Invalid refresh token');
    }
  }
}

module.exports = UserSessionsService;
