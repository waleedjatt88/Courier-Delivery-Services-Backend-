'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BookingParcels', 'pickupZoneId', {
      type: Sequelize.INTEGER,
      allowNull: true, 
      references: { model: 'Zones', key: 'id' },
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('BookingParcels', 'deliveryZoneId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Zones', key: 'id' },
      onDelete: 'SET NULL'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('BookingParcels', 'pickupZoneId');
    await queryInterface.removeColumn('BookingParcels', 'deliveryZoneId');
  }
};