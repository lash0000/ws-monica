const express = require('express');
const router = express.Router();

// Import route groups
const userCredsRoutes = require('../modules/user_creds/user_creds.rt');
const f_authMiddleware = require('../middlewares/auth.mw');

// Register route groups
router.use('/user-creds', userCredsRoutes);

module.exports = router;
