const { Op } = require('sequelize');
const UserSessions = require('./user_sessions.mdl');

class UserSessionsService {
  constructor(io) {
    this.io = io;
  }

  async createSession(user_id, extra = {}) {
    if (!user_id) throw new Error('Missing user_id');

    return await UserSessions.create({
      user_id,
      login_date: new Date(),
      logout_date: null,
      logout_info: null,
      login_info: extra.login_info || null,
    });
  }

  async closeSessionByUserId(user_id, extra = {}) {
    const session = await UserSessions.findOne({
      where: { user_id, logout_date: { [Op.is]: null } },
      order: [['login_date', 'DESC']],
    });
    if (!session) throw new Error('No active session found for user_id');

    session.logout_date = new Date();
    session.logout_info = extra.logout_info || null;
    await session.save();

    return session;
  }

  async closeSessionBySessionId(session_id, extra = {}) {
    const session = await UserSessions.findOne({
      where: { session_id: String(session_id), logout_date: { [Op.is]: null } },
      order: [['login_date', 'DESC']],
    });
    if (!session) throw new Error('No active session found for sessionId');

    session.logout_date = new Date();
    session.logout_info = extra.logout_info || null;
    await session.save();

    return session;
  }

  async countActiveSessions() {
    return await UserSessions.count({
      where: { logout_date: null, logout_info: null },
    });
  }
}

module.exports = UserSessionsService;
