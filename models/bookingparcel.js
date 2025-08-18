'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BookingParcel extends Model {
    static associate(models) {
      // Ek Parcel kisi ek User (customer) ka hota hai
      BookingParcel.belongsTo(models.User, {
        foreignKey: 'customerId',
        as: 'Customer'
      });

      // Ek Parcel kisi ek User (agent) ko assign hota hai
      BookingParcel.belongsTo(models.User, {
        foreignKey: 'agentId',
        as: 'Agent'
      });
    }
  }
  BookingParcel.init({
    trackingNumber: DataTypes.STRING, customerId: DataTypes.INTEGER, agentId: DataTypes.INTEGER,
    pickupAddress: DataTypes.TEXT, deliveryAddress: DataTypes.TEXT, packageWeight: DataTypes.FLOAT,
    packageSize: DataTypes.STRING, packageContent: DataTypes.STRING, pickupSlot: DataTypes.STRING,
    specialInstructions: DataTypes.TEXT, deliveryCharge: DataTypes.FLOAT,
    status: DataTypes.ENUM('pending', 'in_transit', 'scheduled', 'out_for_delivery', 'delivered', 'cancelled'),
    paymentMethod: DataTypes.ENUM('COD', 'JAZZCASH'),
    paymentStatus: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'BookingParcel',
  });
  return BookingParcel;
};