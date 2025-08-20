'use strict';
module.exports = { 
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('BookingParcels', 'status', {
      type: Sequelize.ENUM('pending', 'scheduled', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('BookingParcels', 'status', {
      type: Sequelize.ENUM('pending', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    });
  }
};