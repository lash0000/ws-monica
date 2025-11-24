const { DataTypes } = require('sequelize');
const db_sequelize = require('../../../config/db.config');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');
const mdl_UserProfile = require('../user_profile/user_profile.mdl')

const mdl_Applications = db_sequelize.define('Applications', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  application_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'user_credentials',
      key: 'user_id'
    },
    onDelete: 'CASCADE'
  },
  action_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'user_credentials',
      key: 'user_id'
    },
    onDelete: 'CASCADE'
  },
  application_service: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('for-review', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'for-review'
  },
  additional_details: {
    type: DataTypes.JSONB,
    allowNull: true
  }
},
  {
    tableName: 'applications',
    timestamps: true
  }
);

// belongsTo (One to one)
// hasMany (One to many)
mdl_Applications.belongsTo(mdl_UserCredentials, { foreignKey: 'action_by', as: 'ApplicationAction' })
mdl_Applications.belongsTo(mdl_UserCredentials, { foreignKey: 'application_by', as: 'ApplicationCreator' })

module.exports = mdl_Applications;
