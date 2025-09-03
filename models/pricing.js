"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Pricing extends Model {
    
    static associate(models) {
      Pricing.belongsTo(models.Zone, { foreignKey: "zoneId" });
    }
  }
  Pricing.init(
    {
      zoneId: DataTypes.INTEGER,
      baseFare: DataTypes.FLOAT,
      perKgCharge: DataTypes.FLOAT,
      expressChargePercent: DataTypes.FLOAT,
    },
    {
      sequelize,
      modelName: "Pricing",
    }
  );
  return Pricing;
};
