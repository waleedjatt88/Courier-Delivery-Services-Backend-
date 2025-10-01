'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WeightSlab extends Model {
    static associate(models) {}
  }
  WeightSlab.init({
    minWeight: { type: DataTypes.FLOAT, allowNull: false },
    maxWeight: { type: DataTypes.FLOAT, allowNull: false },
    charge: { type: DataTypes.FLOAT, allowNull: false }
  }, {
    sequelize,
    modelName: 'WeightSlab',
  });
  return WeightSlab;
};