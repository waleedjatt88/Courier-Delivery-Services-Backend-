'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query("ALTER TYPE \"enum_BookingParcels_status\" ADD VALUE 'order_placed';");
    await queryInterface.changeColumn('BookingParcels', 'status', {
        type: Sequelize.ENUM('pending', 'scheduled', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'order_placed'),
        defaultValue: 'order_placed'
    });
  },
  async down(queryInterface, Sequelize) {
  }
};