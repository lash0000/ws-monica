const mdl_UserCredentials = require('./user_creds.mdl');
const UserSessionsService = require('../user_sessions/user_sessions.srv');

class UserCredsService extends UserSessionsService {
  constructor() {
    super();
    this.model = mdl_UserCredentials;
    this.f_validateSession = this.f_validateSession.bind(this);
  }

  /**
   * Validate a session using session_id instead of refresh_token
   */
  async f_validateSession(sessionId) {
    try {
      if (!sessionId) throw new Error('Session ID required');

      // Check if session exists
      const session = await this.f_findBySessionId(sessionId);

      // Lifetime check (15 days from createdAt)
      const createdAt = new Date(session.createdAt);
      const now = new Date();
      const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);

      if (diffDays > 15) throw new Error('Session expired (15-day lifetime ended)');
      if (session.logout_date) throw new Error('Session invalid — user logged out');

      return { session };
    } catch (err) {
      throw new Error(`Session validation failed: ${err.message}`);
    }
  }
}

module.exports = new UserCredsService();
