const express = require('express');
const automationRoutes = require('../modules/client/automation.rt');

class mainRoutes {
  constructor() {
    this.router = express.Router();
    this.registerRoutes(this.router);
  }

  registerRoutes(router) {
    router.use('/ollama', automationRoutes);

  }

  getRouter() {
    return this.router;
  }
}

module.exports = new mainRoutes().getRouter();
