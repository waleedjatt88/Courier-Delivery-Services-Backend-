'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BookingParcels', 'bookingsource', {
      type: Sequelize.ENUM('web', 'manual'),
      allowNull: false,
      defaultValue: 'web'
    });

    await queryInterface.sequelize.query(
      "ALTER TYPE \"public\".\"enum_BookingParcels_paymentMethod\" ADD VALUE IF NOT EXISTS 'CASH';"
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('BookingParcels', 'source');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "public"."enum_BookingParcels_source";');
  }
};