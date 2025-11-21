const UserProfileService = require('./user_profile.srv');

class UserProfileController {
  constructor(io) {
    this.service = new UserProfileService(io);
  }

  addProfile = async (req, res) => {
    try {
      const data = await this.service.addProfile(req.body);
      res.status(201).json({ success: true, profile: data });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  updateProfile = async (req, res) => {
    try {
      const data = await this.service.updateProfile(req.params.id, req.body);
      res.status(200).json({ success: true, profile: data });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  myUpdateProfile = async (req, res) => {
    try {
      const user_id = req.user.user_id;
      const updated = await this.service.myUpdateProfile(user_id, req.body);
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  getProfile = async (req, res) => {
    try {
      const data = await this.service.getProfile();
      res.status(200).json({ success: true, profiles: data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  getProfileByID = async (req, res) => {
    try {
      const data = await this.service.getProfileByID(req.params.id);
      res.status(200).json({ success: true, profile: data });
    } catch (err) {
      res.status(404).json({ success: false, error: err.message });
    }
  }

  myProfile = async (req, res) => {
    try {
      const user_id = req.user.user_id;
      const data = await this.service.myProfile(user_id);
      if (!data) return res.status(404).json({ message: "Profile not found" });

      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = UserProfileController;
