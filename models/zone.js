"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Zone extends Model {
   
    static associate(models) {
      Zone.hasMany(models.Pricing, { foreignKey: "zoneId" });
    }
  }
  Zone.init(
    {
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Zone",
    }
  );
  return Zone;
};
