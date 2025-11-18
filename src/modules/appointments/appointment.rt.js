const express = require('express');
const AppointmentController = require('./appointment.ctrl');

module.exports = (io) => {
  const router = express.Router();
  const controller = new AppointmentController(io);
  const f_authMiddleware = require('../../middlewares/auth.mw');

  router.post("/", f_authMiddleware, (req, res) =>
    controller.createAppointment(req, res)
  );
  router.get("/user/:id", f_authMiddleware, (req, res) =>
    controller.get_MyAppointment(req, res)
  );
  router.get("/:id", f_authMiddleware, (req, res) =>
    controller.getAppointmentById(req, res)
  );
  router.get("/", f_authMiddleware, (req, res) =>
    controller.getAppointments(req, res)
  );
  router.patch("/:id", f_authMiddleware, (req, res) =>
    controller.updateAppointment(req, res)
  );

  return router;
};
