// TODO: Adddata and updateData with EmailService

const sequelize = require('../../../config/db.config');
const mdl_Applications = require('./application.mdl');
const mdl_UserProfile = require('../user_profile/user_profile.mdl');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');

class ApplicationService {
  constructor(io) {
    this.io = io;
  }

  async createApplication(payload) {
    const t = await sequelize.transaction();

    try {
      const profile = await mdl_UserProfile.findOne({
        where: { user_id: payload.application_by },
        transaction: t
      });

      if (!profile) {
        throw new Error("User profile does not exist. Complete profile first.");
      }

      const app = await mdl_Applications.create(payload, { transaction: t });

      await t.commit();

      this.io.emit('application:created', app);

      return app;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async updateApplication(id, payload) {
    const t = await sequelize.transaction();

    try {
      const app = await mdl_Applications.findByPk(id, { transaction: t });
      if (!app) throw new Error('Application not found');

      await app.update(payload, { transaction: t });

      await t.commit();

      this.io.emit('application:updated', app);

      return app;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }


  async myApplications(user_id) {
    return mdl_Applications.findAll({
      where: { application_by: user_id },

      include: [
        {
          model: mdl_UserCredentials,
          as: 'ApplicationCreator',
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        },
        {
          model: mdl_UserCredentials,
          as: 'ApplicationAction',
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        }
      ]
    });
  }

  async getApplicationById(id) {
    return mdl_Applications.findByPk(id, {
      include: [
        {
          model: mdl_UserCredentials,
          as: 'ApplicationCreator',
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        },
        {
          model: mdl_UserCredentials,
          as: 'ApplicationAction',
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        }
      ]
    });
  }

  async getAllApplications() {
    return mdl_Applications.findAll({
      include: [
        {
          model: mdl_UserCredentials,
          as: 'ApplicationCreator',
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        },
        {
          model: mdl_UserCredentials,
          as: 'ApplicationAction',
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        }
      ]
    });
  }
}

module.exports = ApplicationService;
