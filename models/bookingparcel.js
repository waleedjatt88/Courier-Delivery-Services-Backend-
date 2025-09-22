"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BookingParcel extends Model {
    static associate(models) {
      BookingParcel.belongsTo(models.User, {
        foreignKey: "customerId",
        as: "Customer",
      });

      BookingParcel.belongsTo(models.User, {
        foreignKey: "agentId",
        as: "Agent",
      });

       BookingParcel.belongsTo(models.Zone, {
        foreignKey: 'pickupZoneId',
        as: 'PickupZone' 
      });

      BookingParcel.belongsTo(models.Zone, {
        foreignKey: 'deliveryZoneId',
        as: 'DeliveryZone' 
      });

      BookingParcel.hasMany(models.Media, {
        foreignKey: "relatedId",
        constraints: false,
        scope: {
          relatedType: "parcel",
        },
        as: "ParcelFiles",
      });
      BookingParcel.hasMany(models.Ticket, { foreignKey: "parcelId" });
    }
  }
  BookingParcel.init(
    {
      trackingNumber: DataTypes.STRING,
      customerId: DataTypes.INTEGER,
      agentId: DataTypes.INTEGER,
      pickupAddress: DataTypes.TEXT,
      deliveryAddress: DataTypes.TEXT,
      packageWeight: DataTypes.FLOAT,
      packageSize: DataTypes.STRING,
      packageContent: DataTypes.STRING,
      pickupSlot: DataTypes.STRING,
      specialInstructions: DataTypes.TEXT,
      deliveryCharge: DataTypes.FLOAT,
      status: DataTypes.ENUM(
        "unconfirmed",
        "order_placed",
        "scheduled",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "cancelled"
      ),
      paymentMethod: {
        type: DataTypes.ENUM("COD", "JAZZCASH", "STRIPE", "CASH"),
        allowNull: true,
      },
      paymentStatus: DataTypes.STRING,
      pickupLat: DataTypes.FLOAT,
      pickupLng: DataTypes.FLOAT,
      deliveryLat: DataTypes.FLOAT,
      deliveryLng: DataTypes.FLOAT,
      deliveryType: DataTypes.ENUM("scheduled", "instant"),
      agentAcceptanceStatus: DataTypes.ENUM("pending", "accepted", "rejected"),
      agentRejectionReason: DataTypes.TEXT,
      assignedAt: DataTypes.DATE,
      agentCommission: DataTypes.FLOAT,
      bookingsource: DataTypes.ENUM("web", "manual"),
      remainingAmount: DataTypes.FLOAT,
      pickupZoneId: DataTypes.INTEGER,
      deliveryZoneId: DataTypes.INTEGER,
    },

    {
      sequelize,
      modelName: "BookingParcel",
    }
  );
  return BookingParcel;
};
