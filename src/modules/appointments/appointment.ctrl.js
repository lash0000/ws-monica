const AppointmentService = require('./appointment.srv');

class AppointmentController {
  constructor(io) {
    this.service = new AppointmentService(io);
  }

  createAppointment = async (req, res) => {
    try {
      const payload = req.body;
      const created = await this.service.createAppointment(payload);

      res.status(201).json({
        success: true,
        appointment: created
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  };

  updateAppointment = async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body;
      const updated = await this.service.updateAppointment(id, payload);

      res.json({
        success: true,
        appointment: updated
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  };

  getAppointments = async (req, res) => {
    try {
      const list = await this.service.getAppointments(req.query);

      res.json({
        success: true,
        appointments: list
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  };

  get_MyAppointment = async (req, res) => {
    try {
      const user_id = req.params.id;
      const apps = await this.service.myAppointments(user_id);
      return res.status(200).json({ success: true, appointments: apps });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  getAppointmentById = async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await this.service.getAppointmentById(id);

      res.json({
        success: true,
        appointment
      });
    } catch (err) {
      res.status(404).json({
        success: false,
        message: err.message
      });
    }
  };
}

module.exports = AppointmentController;
