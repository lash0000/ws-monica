const { DataTypes } = require('sequelize');
const db_sequelize = require('../../../config/db.config');
const mdl_Tickets = require('../tickets/ticket.mdl');

const mdl_AIReview = db_sequelize.define('AIReview', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  }, 
  ticket_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tickets',
      key: 'id'
    },
    onDelete: 'CASCADE',
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  actions: {
    type: DataTypes.JSONB,
    allowNull: true,
  }
}, {
  tableName: 'ai_review',  // Moved inside options object
  timestamps: true
});

// Correct Relationships
mdl_AIReview.belongsTo(mdl_Tickets, { foreignKey: 'ticket_id' });
mdl_Tickets.hasOne(mdl_AIReview, { foreignKey: 'ticket_id' });

module.exports = mdl_AIReview;
