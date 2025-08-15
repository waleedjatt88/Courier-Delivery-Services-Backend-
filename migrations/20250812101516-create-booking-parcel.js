'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BookingParcels', { // Table ka naam 'BookingParcels' hoga
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
          model: 'Users', // 'Users' table se link hai
          key: 'id'
        },
        onDelete: 'CASCADE' // Agar user delete ho, to uske parcel bhi delete ho jaayein
      },
      agentId: {
        type: Sequelize.INTEGER,
        allowNull: true, // Shuru mein agent assign nahi hoga
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL' // Agar agent delete ho, to parcel se uska link hat jaaye
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