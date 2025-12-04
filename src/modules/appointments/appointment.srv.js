// TODO: Adddata and updateData with EmailService

const mdl_Appointments = require('./appointment.mdl');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');
const mdl_UserProfile = require('../user_profile/user_profile.mdl')
const sequelize = require('../../../config/db.config');
const { asyncTaskRunner } = require('../../utils/async_task_runner.utils');
const EmailService = require('../email/email.srv');
const moment = require('moment-timezone');

class AppointmentService {
  constructor(io) {
    this.io = io;
  }

  async createAppointment(payload) {
    const t = await sequelize.transaction();

    try {
      // Validate user has a profile
      const profile = await mdl_UserProfile.findOne({
        where: { user_id: payload.appointment_by },
        transaction: t
      });

      if (!profile) {
        throw new Error("User profile is incomplete. Complete profile first.");
      }

      const nowPH = moment().tz("Asia/Manila").startOf("minute");
      const scheduledPH = moment(payload.date_scheduled).tz("Asia/Manila");

      if (!scheduledPH.isValid()) {
        throw new Error("Invalid date_scheduled format.");
      }

      if (scheduledPH.isBefore(nowPH)) {
        throw new Error("You cannot schedule an appointment in the past.");
      }

      const appointment = await mdl_Appointments.create(payload, { transaction: t });
      const appointmentForEmail = {
        id: appointment.id,
        category: appointment.category,
        status: appointment.status,
        details: appointment.details,
        remarks: appointment.remarks,
        date_scheduled_iso: appointment.date_scheduled,
        date_scheduled_formatted: moment(appointment.date_scheduled)
          .tz("Asia/Manila")
          .format("MMMM D, YYYY h:mm A"),
      };

      await t.commit();
      this.io.emit('appointment:created', appointment);

      // Background email
      asyncTaskRunner(() =>
        EmailService.sendToUser({
          user_id: payload.appointment_by,
          template: "appointments/creator",
          subject: "Your schedule of appointment for Telekonsulta has been submitted.",
          data: { appointment: appointmentForEmail, profile }
        })
      );

      return appointment;

    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async updateAppointment(id, payload) {
    const t = await sequelize.transaction();

    try {
      const appointment = await mdl_Appointments.findByPk(id, { transaction: t });
      if (!appointment) throw new Error('Appointment not found');
      await appointment.update(payload, { transaction: t });

      const profile = await mdl_UserProfile.findOne({
        where: { user_id: appointment.appointment_by }
      });

      if (!profile) {
        throw new Error("Your user profile went missing or incomplete. Complete profile first.");
      }

      const appointmentEmailData = {
        id: appointment.id,
        category: appointment.category,
        status: appointment.status,
        details: appointment.details,
        remarks: appointment.remarks,
        date_scheduled_iso: appointment.date_scheduled,
        date_scheduled_formatted: moment(appointment.date_scheduled)
          .tz("Asia/Manila")
          .format("MMMM D, YYYY h:mm A")
      };

      await t.commit();
      this.io.emit('appointment:updated', appointment);

      let templatePath = "";
      let subjectLine = "";

      switch (appointment.status) {
        case "withdrawn":
          templatePath = "appointments/withdrawn";
          subjectLine = "Your appointment has been withdrawn.";
          break;
        default:
          templatePath = "appointments/actions";
          subjectLine = "Your appointment has been updated.";
          break;
      }

      asyncTaskRunner(() =>
        EmailService.sendToUser({
          user_id: appointment.appointment_by,
          template: templatePath,
          subject: subjectLine,
          data: {
            appointment: appointmentEmailData,
            profile
          }
        })
      );

      return appointment;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async getAppointments(filters = {}) {
    const { status, appointment_by, action_by } = filters;
    const where = {};

    if (status) where.status = status;
    if (appointment_by) where.appointment_by = appointment_by;
    if (action_by) where.action_by = action_by;

    const results = await mdl_Appointments.findAll({
      where,
      include: [
        {
          model: mdl_UserCredentials,
          as: 'AppointmentOwner',
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        },
        {
          model: mdl_UserCredentials,
          as: 'AppointmentAction',
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        }
      ],
      order: [['date_scheduled', 'ASC']]
    });

    return results;
  }

  async myAppointments(user_id) {
    return mdl_Appointments.findAll({
      where: { appointment_by: user_id },

      include: [
        {
          model: mdl_UserCredentials,
          as: 'AppointmentOwner',
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        },
        {
          model: mdl_UserCredentials,
          as: 'AppointmentAction',
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        }
      ]
    });
  }

  async getAppointmentById(id) {
    return mdl_Appointments.findByPk(id, {
      include: [
        {
          model: mdl_UserCredentials,
          as: 'AppointmentOwner',
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        },
        {
          model: mdl_UserCredentials,
          as: 'AppointmentAction',
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

module.exports = AppointmentService;
