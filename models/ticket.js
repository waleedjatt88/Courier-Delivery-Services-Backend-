'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    static associate(models) {
      Ticket.belongsTo(models.User, { foreignKey: 'customerId' });
      Ticket.belongsTo(models.BookingParcel, { foreignKey: 'parcelId' });
    }
  }
  Ticket.init({
    customerId: DataTypes.INTEGER,
    parcelId: DataTypes.INTEGER,
    subject: DataTypes.STRING,
    description: DataTypes.TEXT,
    status: DataTypes.ENUM('open', 'in_progress', 'closed')
  }, {
    sequelize,
    modelName: 'Ticket',
  });
  return Ticket;
};