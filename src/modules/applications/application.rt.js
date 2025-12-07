const express = require('express');
const ApplicationController = require('./application.ctrl');

module.exports = (io) => {
  const router = express.Router();
  const controller = new ApplicationController(io);
  const f_authMiddleware = require('../../middlewares/auth.mw');

  router.get("/analytics", f_authMiddleware, (req, res) =>
    controller.list_Application(req, res)
  );
  router.post("/", f_authMiddleware, (req, res) =>
    controller.create_New_Application(req, res)
  );
  router.get("/user/:id", f_authMiddleware, (req, res) =>
    controller.get_MyApplication(req, res)
  );
  router.get("/", f_authMiddleware, (req, res) =>
    controller.get_All_Application(req, res)
  );
  router.get("/view/:id", f_authMiddleware, (req, res) =>
    controller.get_Application_By_Id(req, res)
  );
  router.patch("/:id", f_authMiddleware, (req, res) =>
    controller.update_Application(req, res)
  );

  return router;
};
