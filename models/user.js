'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.BookingParcel, {
        foreignKey: 'customerId',
        as: 'CustomerParcels'
      });

      User.hasMany(models.BookingParcel, {
        foreignKey: 'agentId',
        as: 'AgentTasks'
      });

      User.hasMany(models.Media, {
        foreignKey: 'relatedId',
        constraints: false, 
        scope: {
          relatedType: 'user' 
        },
        as: 'ProfilePictures' 
      });

      User.hasMany(models.Ticket, { foreignKey: 'customerId' });

    }
  }
  User.init({
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
      },

       isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  suspendedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },

address: {
  type: DataTypes.TEXT,
  allowNull: true,
  defaultValue: null
}
    

  }, { 
    sequelize,
    modelName: 'User',
  });
  return User;
};