'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BookingParcels', 'remainingAmount', {
      type: Sequelize.FLOAT,
      allowNull: true 
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('BookingParcels', 'remainingAmount');
  }
};