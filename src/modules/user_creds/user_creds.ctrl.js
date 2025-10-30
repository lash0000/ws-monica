const userCredsService = require('./user_creds.srv');

class UserCredsController {
  /**
   * GET /api/v1/user-creds/verify
   * Verifies refresh token and session validity.
   */
  async verify(req, res) {
    try {
      const refreshToken = req.headers['x-refresh-token'];
      if (!refreshToken) {
        return res.status(400).json({ message: 'Missing refresh token' });
      }

      const { session, decoded } = await userCredsService.f_validateSession(refreshToken);

      // Compute remaining lifetime (days left)
      const createdAt = new Date(session.createdAt);
      const now = new Date();
      const msLeft = createdAt.getTime() + 15 * 24 * 60 * 60 * 1000 - now.getTime();
      const daysLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24)));

      return res.status(200).json({
        message: 'Session verified successfully',
        session_id: session.session_id,
        user_id: decoded.user_id,
        email: decoded.email,
        createdAt: session.createdAt,
        daysLeft,
      });
    } catch (error) {
      return res.status(401).json({
        message: error.message || 'Session verification failed',
      });
    }
  }
}

module.exports = new UserCredsController();
