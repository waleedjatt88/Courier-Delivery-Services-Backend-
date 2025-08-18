'use strict';
module.exports = { // Ya 'export default'
  async up(queryInterface, Sequelize) {
    // MySQL ke liye ENUM ko badalne ka tareeka
    await queryInterface.changeColumn('BookingParcels', 'status', {
      type: Sequelize.ENUM('pending', 'scheduled', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    });
  },

  async down(queryInterface, Sequelize) {
    // Undo karne ke liye, wapas purani list par le jao
    await queryInterface.changeColumn('BookingParcels', 'status', {
      type: Sequelize.ENUM('pending', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    });
  }
};