const { DataTypes } = require('sequelize');
const db_sequelize = require('../../../config/db.config');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');

const mdl_Tickets = db_sequelize.define('Tickets', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'user_credentials',
      key: 'user_id'
    },
    onDelete: 'CASCADE',
    unique: false
  },
  subject: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  concern_details: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority_level: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.TEXT, // resolved / unresolved
    allowNull: false,
    defaultValue: 'pending'
  },
  persons_involved: {
    type: DataTypes.TEXT, // "names only"
    allowNull: true
  },
},
  {
    tableName: 'tickets',
    timestamps: true
  }
);

mdl_Tickets.belongsTo(mdl_UserCredentials, { foreignKey: 'user_id' });

module.exports = mdl_Tickets;
