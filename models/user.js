'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Ek User ke paas (customer ke taur par) kayi BookingParcels ho sakte hain
      User.hasMany(models.BookingParcel, {
        foreignKey: 'customerId',
        as: 'CustomerParcels'
      });

      // Ek User ke paas (agent ke taur par) kayi BookingParcels ho sakte hain
      User.hasMany(models.BookingParcel, {
        foreignKey: 'agentId',
        as: 'AgentTasks'
      });
    }
    
  }
  User.init({
    // --- ATTRIBUTES OBJECT YAHAN SHURU HOTA HAI ---
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin', 'agent'),
      allowNull: false,
      defaultValue: 'customer'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // --- OTP WALE COLUMNS BHI ISI OBJECT MEIN AAYENGE ---
    otp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    otpExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },

     passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refreshToken: {
        type: DataTypes.STRING,
        allowNull: true
      }
    // --- ATTRIBUTES OBJECT YAHAN KHATAM HOTA HAI ---

  }, { // <-- YEH OPTIONS OBJECT HAI
    sequelize,
    modelName: 'User',
  });
  return User;
};