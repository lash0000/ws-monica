// TODO: Generated Document Saved to Cloud
const sequelize = require('../../../config/db.config');
const mdl_Applications = require('./application.mdl');
const mdl_UserProfile = require('../user_profile/user_profile.mdl');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');
const EmailTemplate = require('../../utils/email_template.utils');
const { sendEmail } = require('../../utils/nodemailer.utils');


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

      // Commit instantly
      await t.commit();
      this.io.emit('application:created', app);
      this.sendEmailInBackground(app, profile).catch(err => {
        console.error("Async email error:", err);
      });

      return app;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async sendEmailInBackground(app, profile) {
    try {
      const creds = await mdl_UserCredentials.findOne({
        where: { user_id: app.application_by }
      });

      if (!creds?.email) return;

      const { html, subject } = await EmailTemplate.as_renderAll(
        "applications/ongoing",
        {
          application: app,
          profile,
          subject: "Your application has been submitted for review."
        }
      );

      await sendEmail({
        to: creds.email,
        subject,
        html
      });

    } catch (err) {
      console.error("Background email sending failed:", err);
    }
  }

  async updateApplication(id, payload) {
    const t = await sequelize.transaction();

    try {
      const app = await mdl_Applications.findByPk(id, { transaction: t });
      if (!app) throw new Error('Application not found');

      const prevStatus = app.status;
      await app.update(payload, { transaction: t });
      await t.commit();
      this.io.emit('application:updated', app);

      if (payload.status && payload.status !== prevStatus) {
        const creds = await mdl_UserCredentials.findOne({
          where: { user_id: app.application_by }
        });

        if (creds?.email) {
          let template = null;

          switch (payload.status) {
            case 'approved':
              template = 'applications/approval';
              break;

            case 'withdrawn':
              template = 'applications/withdrawn';
              break;

            default:
              break;
          }

          if (template) {
            const { html, subject } = await EmailTemplate.as_renderAll(template, {
              application: app,
              subject: `Your application has been ${payload.status}.`
            });

            await sendEmail({
              to: creds.email,
              subject,
              html
            });
          }
        }
      }

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
