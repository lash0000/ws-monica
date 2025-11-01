const express = require('express');
const router = express.Router();
const UserCredsController = require('./user_creds.ctrl');

/**
 * @route   GET /api/v1/user-creds/verify
 * @desc    Verifies session validity using session_id
 */
router.post('/verify', (req, res) => UserCredsController.verify(req, res));

/**
 * @route   POST /api/v1/user-creds/session-login
 * @desc    Triggered by stateless backend after login to broadcast new session
 * @access  Public (trusted internal use)
 */
router.post('/session-login', (req, res) => {
  try {
    const io = req.app.get('io');
    const { sessionId, userId } = req.body;

    if (!sessionId || !userId) {
      return res.status(400).json({ message: 'sessionId and userId required' });
    }

    io.emit('session:new', { sessionId, userId, source: 'webhook' });
    return res.status(200).json({ message: 'For session the user credentials broadcasted successfully' });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
