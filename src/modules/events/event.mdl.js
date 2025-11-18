const { DataTypes } = require('sequelize');
const db_sequelize = require('../../../config/db.config');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');

const mdl_Events = db_sequelize.define('Events', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: mdl_UserCredentials,
      key: 'user_id'
    },
    onDelete: 'CASCADE',
  },
  category: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  location: {
    type: DataTypes.JSONB,
    allowNull: true   // { country, region, city, lat, long }
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date_scheduled: {
    type: DataTypes.DATE, // Sequelize handles TIMESTAMPTZ as DATE
    allowNull: false
  },
  date_ended: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  participants: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'events',
  timestamps: true,
});

mdl_Events.belongsTo(mdl_UserCredentials, { foreignKey: 'created_by', as: 'EventCreator' });

module.exports = mdl_Events;
