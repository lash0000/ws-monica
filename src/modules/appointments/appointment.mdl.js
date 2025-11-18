const { DataTypes } = require('sequelize');
const db_sequelize = require('../../../config/db.config');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');

const mdl_Appointments = db_sequelize.define('Appointments', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  appointment_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: mdl_UserCredentials,
      key: 'user_id'
    },
    onDelete: 'CASCADE'
  },
  action_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: mdl_UserCredentials,
      key: 'user_id'
    },
    onDelete: 'CASCADE'
  },
  category: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processed', 'completed', 'withdrawn'),
    defaultValue: 'pending',
    allowNull: false
  },
  date_scheduled: {
    type: DataTypes.DATE, // Sequelize DATE = TIMESTAMPTZ in PG
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'appointments',
  timestamps: true,
});

mdl_Appointments.belongsTo(mdl_UserCredentials, { foreignKey: 'appointment_by', as: 'AppointmentOwner' })
mdl_Appointments.belongsTo(mdl_UserCredentials, { foreignKey: 'action_by', as: 'AppointmentAction' })

module.exports = mdl_Appointments;
