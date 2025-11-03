const UserCredsService = require('./user_creds.srv');
const UserHandler = require('./user_creds.handler');

class UserCredsController {
  constructor(io) {
    this.service = new UserCredsService(io);
    this.handler = new UserHandler();
  }

  async login(req, res) {
    try {
      const result = await this.service.login(req, res);
      this.handler.success(res, 'Login successful', result);
    } catch (error) {
      this.handler.error(res, error.message || 'Login failed', 401);
    }
  }

  async logout(req, res) {
    try {
      const result = await this.service.logout(req, res);
      this.handler.success(res, 'Logout successful', result);
    } catch (error) {
      this.handler.error(res, error.message || 'Logout failed', 400);
    }
  }

  async refresh(req, res) {
    try {
      const result = await this.service.refresh(req, res);
      this.handler.success(res, 'Access token refreshed', result);
    } catch (error) {
      this.handler.error(res, error.message || 'Token refresh failed', 403);
    }
  }
}

module.exports = UserCredsController;
