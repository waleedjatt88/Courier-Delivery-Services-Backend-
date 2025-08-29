'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    static associate(models) {
      Chat.belongsTo(models.User, { foreignKey: 'customerId', as: 'Customer' });
      Chat.belongsTo(models.User, { foreignKey: 'adminId', as: 'Admin' });
    }
  }
  Chat.init({
    customerId: DataTypes.INTEGER,
    adminId: DataTypes.INTEGER,
    message: DataTypes.TEXT,
    sentBy: DataTypes.ENUM('customer', 'admin'),
    clearedByCustomer: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Chat',
  });
  return Chat;
};