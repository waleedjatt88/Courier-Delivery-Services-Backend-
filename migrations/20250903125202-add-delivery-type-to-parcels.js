'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BookingParcels', 'deliveryType', {
      type: Sequelize.ENUM('scheduled', 'instant'),
      allowNull: false,
      defaultValue: 'scheduled'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('BookingParcels', 'deliveryType');
    await queryInterface.sequelize.query('DROP TYPE "public"."enum_BookingParcels_deliveryType";');
  }
};