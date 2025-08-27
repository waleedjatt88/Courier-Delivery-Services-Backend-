'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Media extends Model {
    static associate(models) {
    }
  }
  Media.init({
    url: DataTypes.STRING,
    mediaType: DataTypes.STRING,
    relatedId: DataTypes.INTEGER,
    relatedType: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Media',
  });
  return Media;
};