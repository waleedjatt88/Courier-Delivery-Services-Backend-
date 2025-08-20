'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BookingParcels', { 
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      trackingNumber: {
        type: Sequelize.STRING,
        unique: true
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', 
          key: 'id'
        },
        onDelete: 'CASCADE' 
      },
      agentId: {
        type: Sequelize.INTEGER,
        allowNull: true, 
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      pickupAddress: { type: Sequelize.TEXT, allowNull: false },
      deliveryAddress: { type: Sequelize.TEXT, allowNull: false },
      packageWeight: { type: Sequelize.FLOAT, allowNull: false },
      packageSize: { type: Sequelize.STRING },
      packageContent: { type: Sequelize.STRING },
      pickupSlot: { type: Sequelize.STRING },
      specialInstructions: { type: Sequelize.TEXT },
      deliveryCharge: { type: Sequelize.FLOAT },
      status: {
        type: Sequelize.ENUM('pending', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'),
        defaultValue: 'pending'
      },
      paymentMethod: {
        type: Sequelize.ENUM('COD', 'JAZZCASH')
      },
      paymentStatus: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('BookingParcels');
  }
};