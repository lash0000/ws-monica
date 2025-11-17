const bcrypt = require('bcrypt');
const geoip = require('geoip-lite');
const useragent = require('useragent');
const jwt = require('jsonwebtoken');
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

  async login(req, res) {
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

      const accessToken = jwt.sign(
        {
          user_id: user.user_id,
          email: user.email,
          acc_type: user.acc_type,
          session_id: session.session_id,
        },
        process.env.JWT_ACCESS,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        {
          user_id: user.user_id,
          session_id: session.session_id,
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '15d' }
      );

      /*
       * setup starters 
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      * offline side (httpOnly) 
      res.cookie('refreshToken', refreshToken, {
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
        maxAge: 15 * 24 * 60 * 60 * 1000
      });
       *
       */

      res.cookie('refreshToken', refreshToken, {
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
        maxAge: 15 * 24 * 60 * 60 * 1000
      });


      setImmediate(async () => {
        const activeCount = await this.countActiveSessions();
        broadcastSessionUpdate(this.io, activeCount);
        this.io.emit('server:login_event', {
          user_id: user.user_id,
          session_id: session.session_id,
          login_info: clientInfo,
        });
      });

      return { user_id: user.user_id, session_id: session.session_id, access_token: accessToken };
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
      } else {
        updated = await this.closeSessionBySessionId(sessionId, {
          logout_info: clientInfo,
          transaction: t,
        });
      }

      await t.commit();

      /*
       * setup starters 
      req.res.clearCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
       * offline setup 
      req.res.clearCookie('refreshToken', {
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
        maxAge: 15 * 24 * 60 * 60 * 1000,
      });
       */

      req.res.clearCookie('refreshToken', {
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
        maxAge: 15 * 24 * 60 * 60 * 1000,
      });

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

  async refresh(req, res) {
    const token = req.cookies.refreshToken;
    if (!token) throw new Error('Missing refresh token');

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await UserCredentials.findByPk(decoded.user_id);
      if (!user) throw new Error('User not found');

      const newAccessToken = jwt.sign(
        {
          user_id: user.user_id,
          email: user.email,
          acc_type: user.acc_type,
          session_id: decoded.session_id,
        },
        process.env.JWT_ACCESS,
        { expiresIn: '15m' }
      );

      return { access_token: newAccessToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // For accessing the protected routes
  async validateSession(refreshToken) {
    if (!refreshToken) {
      throw new Error('Missing refresh token');
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await UserCredentials.findByPk(decoded.user_id);
      if (!user) {
        throw new Error('User not found');
      }

      const session = await UserSessions.findOne({
        where: {
          session_id: decoded.session_id,
          user_id: decoded.user_id,
          logout_date: { [Op.is]: null },
          logout_info: { [Op.is]: null },
        },
      });

      if (!session) {
        throw new Error('Session is invalid or expired');
      }

      return { session, decoded };
    } catch (err) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async _updateSessionCount() {
    const activeCount = await this.countActiveSessions();
    broadcastSessionUpdate(this.io, activeCount);
  }
}

module.exports = UserCredsService;
