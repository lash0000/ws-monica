const jwt = require('jsonwebtoken');

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

    const decodedAccess = jwt.verify(token, process.env.JWT_ACCESS);
    req.user = decodedAccess;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token has expired' });
    }
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
};

module.exports = f_authMiddleware;
