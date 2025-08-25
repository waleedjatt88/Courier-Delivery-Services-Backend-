'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BookingParcels', 'pickupLat', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
    await queryInterface.addColumn('BookingParcels', 'pickupLng', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
    
    await queryInterface.addColumn('BookingParcels', 'deliveryLat', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
    await queryInterface.addColumn('BookingParcels', 'deliveryLng', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('BookingParcels', 'pickupLat');
    await queryInterface.removeColumn('BookingParcels', 'pickupLng');
    await queryInterface.removeColumn('BookingParcels', 'deliveryLat');
    await queryInterface.removeColumn('BookingParcels', 'deliveryLng');
  }
};