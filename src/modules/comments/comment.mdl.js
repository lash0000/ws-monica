const { DataTypes } = require('sequelize');
const db_sequelize = require('../../../config/db.config');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');

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

mdl_Comments.belongsTo(mdl_UserCredentials, { foreignKey: 'commented_by', as: 'Profile' });

module.exports = mdl_Comments;
