const jwt = require('jsonwebtoken');
const userCredsService = require('../modules/user_creds/user_creds.srv');

const f_authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Bearer token malformed' });
    }

    const decodedAccess = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedAccess;
    const refreshToken = req.headers['x-refresh-token'];
    if (!refreshToken) {
      return res.status(401).json({ message: 'Missing refresh token' });
    }
    const { session, decoded } = await userCredsService.f_validateSession(refreshToken);
    req.session = session;
    req.refreshUser = decoded;

    // Continue to protected route
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token has expired' });
    }
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
};

module.exports = f_authMiddleware;
