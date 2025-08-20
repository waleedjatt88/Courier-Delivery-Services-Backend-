'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: false 
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true 
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true 
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: { 
        type: Sequelize.ENUM('customer', 'admin', 'agent'),
        allowNull: false,
        defaultValue: 'customer'
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false 
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
    await queryInterface.dropTable('Users');
  }
};