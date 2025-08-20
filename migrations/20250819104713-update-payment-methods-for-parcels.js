'use strict';
module.exports = { 
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('BookingParcels', 'paymentMethod', {
      type: Sequelize.ENUM('COD', 'JAZZCASH', 'STRIPE'),
      allowNull: true 
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('BookingParcels', 'paymentMethod', {
      type: Sequelize.ENUM('COD', 'JAZZCASH')
    });
  }
};