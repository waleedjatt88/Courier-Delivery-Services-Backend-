'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BookingParcels', 'agentAcceptanceStatus', {
      type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
      defaultValue: 'pending'
    });
    await queryInterface.addColumn('BookingParcels', 'agentRejectionReason', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('BookingParcels', 'assignedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('BookingParcels', 'agentCommission', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
  },
  async down(queryInterface, Sequelize) {
    }
};