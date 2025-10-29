const express = require('express');

class MainRoutes {
  constructor() {
    this.router = express.Router();
    this.RegisterRoutes(this.router);
  }

  RegisterRoutes(router) {
    // router.use('/files', FilesRoutes);
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new MainRoutes().getRouter();
