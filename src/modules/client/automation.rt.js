const { Router } = require('express');
const AutomationController = require('./automation.ctrl');
const router = Router();

router.post('/prompt', AutomationController.runPrompt);

module.exports = router;
