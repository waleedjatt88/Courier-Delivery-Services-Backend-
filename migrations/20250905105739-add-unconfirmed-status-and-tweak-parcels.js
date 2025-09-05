'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TYPE \"public\".\"enum_BookingParcels_status\" ADD VALUE 'unconfirmed' BEFORE 'order_placed';"
    );
    await queryInterface.changeColumn('BookingParcels', 'paymentMethod', {
      type: Sequelize.ENUM('COD', 'JAZZCASH', 'STRIPE'),
      allowNull: true 
    });
  },
  async down(queryInterface, Sequelize) { /* ... */ }
};