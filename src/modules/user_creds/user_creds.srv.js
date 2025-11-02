const bcrypt = require('bcrypt');
const geoip = require('geoip-lite');
const useragent = require('useragent');
const { Op } = require('sequelize');
const sequelize = require('../../../config/db.config');
const UserCredentials = require('./user_creds.mdl');
const UserSessions = require('../user_sessions/user_sessions.mdl');
const UserSessionsService = require('../user_sessions/user_sessions.srv');
const { broadcastSessionUpdate } = require('../../utils/realtime.utils');

class UserCredsService extends UserSessionsService {
  constructor(io) {
    super(io);
    this.io = io;
  }

  _extractClientInfo(req) {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.connection.remoteAddress ||
      'unknown';
    const geo = geoip.lookup(ip);
    const agent = useragent.parse(req.headers['user-agent'] || '');

    return {
      ip,
      browser: agent.toAgent(),
      os: agent.os.toString(),
      location: geo
        ? `${geo.city || 'Unknown City'}, ${geo.country || 'Unknown Country'}`
        : 'Unknown Location',
    };
  }

  async login(req) {
    const { email, password } = req.body;
    const t = await sequelize.transaction();

    try {
      const user = await UserCredentials.findOne({
        where: { email, is_active: true },
        transaction: t,
      });
      if (!user) throw new Error('User not found or inactive');

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error('Invalid credentials');
      const existingActiveSession = await UserSessions.findOne({
        where: {
          user_id: user.user_id,
          logout_date: { [Op.is]: null },
          logout_info: { [Op.is]: null },
        },
        transaction: t,
      });
      if (existingActiveSession) {
        throw new Error('User is already logged in on another session.');
      }

      const clientInfo = this._extractClientInfo(req);
      const session = await UserSessions.create(
        {
          user_id: user.user_id,
          login_date: new Date(),
          login_info: clientInfo,
        },
        { transaction: t }
      );

      await t.commit();
      setImmediate(async () => {
        const activeCount = await this.countActiveSessions();
        broadcastSessionUpdate(this.io, activeCount);
        this.io.emit('server:login_event', {
          user_id: user.user_id,
          session_id: session.session_id,
          login_info: clientInfo,
        });
      });


      return { user_id: user.user_id, session_id: session.session_id };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async logout(req) {
    const { user_id, sessionId } = req.body;
    if (!user_id && !sessionId) throw new Error('Missing user_id or sessionId');

    const t = await sequelize.transaction();
    try {
      const clientInfo = this._extractClientInfo(req);
      let updated;

      if (user_id) {
        updated = await this.closeSessionByUserId(user_id, {
          logout_info: clientInfo,
          transaction: t,
        });
      } else if (sessionId) {
        updated = await this.closeSessionBySessionId(sessionId, {
          logout_info: clientInfo,
          transaction: t,
        });
      }

      await t.commit();

      setImmediate(async () => {
        const activeCount = await this.countActiveSessions();
        broadcastSessionUpdate(this.io, activeCount);
        this.io.emit('server:logout_event', {
          ...(user_id ? { user_id } : { session_id: sessionId }),
          logout_info: clientInfo,
        });
      });

      return updated;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async _updateSessionCount() {
    const activeCount = await this.countActiveSessions();
    broadcastSessionUpdate(this.io, activeCount);
  }
}

module.exports = UserCredsService;
