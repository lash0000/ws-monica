const { DataTypes } = require('sequelize');
const db_sequelize = require('../../../config/db.config');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');
const mdl_Tickets = require('../tickets/ticket.mdl');
const mdl_UserProfile = require('../user_profile/user_profile.mdl');

const mdl_Comments = db_sequelize.define('Events', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  category: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  commented_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: mdl_UserCredentials,
      key: 'user_id'
    },
    onDelete: 'CASCADE'
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false
  },
}, {
  tableName: 'comments',
  timestamps: true,
});

mdl_Comments.belongsTo(mdl_UserCredentials, {
  foreignKey: 'commented_by',
  as: 'UserCredential'
});
mdl_Comments.belongsTo(mdl_UserProfile, {
  foreignKey: 'commented_by',
  targetKey: 'user_id',
  as: 'UserProfile',
  constraints: false
})
mdl_Comments.belongsTo(mdl_Tickets, {
  foreignKey: 'parent_id',
  as: 'Ticket_Details',
  constraints: false
});

module.exports = mdl_Comments;
