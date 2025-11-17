const ApplicationService = require('./application.srv');

class ApplicationController {
  constructor(io) {
    this.service = new ApplicationService(io);
  }

  create_New_Application = async (req, res) => {
    try {
      const data = await this.service.createApplication(req.body);
      res.status(201).json({ success: true, application: data });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  update_Application = async (req, res) => {
    try {
      const data = await this.service.updateApplication(req.params.id, req.body);
      res.status(200).json({ success: true, application: data });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  get_All_Application = async (req, res) => {
    try {
      const apps = await this.service.getAllApplications();
      res.status(200).json({ success: true, applications: apps });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  get_MyApplication = async (req, res) => {
    try {
      const user_id = req.params.id;
      const apps = await this.service.myApplications(user_id);
      return res.status(200).json({ success: true, applications: apps });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  get_Application_By_Id = async (req, res) => {
    try {
      const app = await this.service.getApplicationById(req.params.id);
      res.status(200).json({ success: true, application: app });
    } catch (err) {
      res.status(404).json({ success: false, error: err.message });
    }
  }
}

module.exports = ApplicationController;
