'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Pricings', 'perKgCharge');
  },

  async down (queryInterface, Sequelize) {
  
    await queryInterface.addColumn('Pricings', 'perKgCharge', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
  }
};