const { DataTypes } = require('sequelize');
const db_sequelize = require('../../../config/db.config');
const UserCredentials = require('../user_creds/user_creds.mdl');
const mdl_Tickets = require('../tickets/ticket.mdl');

const mdl_Files = db_sequelize.define('Files', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  ticket_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: mdl_Tickets,
      key: 'id'
    }
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  uploaded_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: UserCredentials,
      key: 'user_id'
    },
  },
}, {
  tableName: 'files',
  timestamps: true
});

// cardinality: one to many
mdl_Files.belongsTo(UserCredentials, { foreignKey: 'uploaded_by' });
UserCredentials.hasMany(mdl_Files, { foreignKey: 'uploaded_by' });

mdl_Files.belongsTo(mdl_Tickets, { foreignKey: 'ticket_id' });
mdl_Tickets.hasMany(mdl_Files, { foreignKey: 'ticket_id' });

module.exports = mdl_Files; 
