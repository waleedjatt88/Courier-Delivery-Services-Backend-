'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Page extends Model {
    static associate(models) {}
  }
  Page.init({
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.JSONB, 
      allowNull: false
    }
  }, { sequelize, modelName: 'Page' });
  return Page;
};