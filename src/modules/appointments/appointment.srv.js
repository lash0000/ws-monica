// TODO: Adddata and updateData with EmailService

const mdl_Appointments = require('./appointment.mdl');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');
const mdl_UserProfile = require('../user_profile/user_profile.mdl')
const sequelize = require('../../../config/db.config');

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
        throw new Error("User profile does not exist. Complete profile first.");
      }

      // Create appointment
      const appointment = await mdl_Appointments.create(payload, { transaction: t });

      await t.commit();

      // Emit websocket event
      this.io.emit('appointment:created', appointment);

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

      await t.commit();

      // Emit websocket event
      this.io.emit('appointment:updated', appointment);

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
