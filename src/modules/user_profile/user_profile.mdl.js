const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');

const mdl_UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'user_credentials',
      key: 'user_id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  birthdate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  phone_number: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  user_type: {
    type: DataTypes.ENUM('User', 'Admin'),
    allowNull: false,
    defaultValue: 'User'
  },
  admin_role: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type_of_residency: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  address: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  gender: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nationality: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  civil_status: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'user_profile',
  timestamps: true
});


module.exports = mdl_UserProfile;
