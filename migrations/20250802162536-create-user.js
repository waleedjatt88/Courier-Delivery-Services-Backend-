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
        allowNull: false // Hum chahte hain ke naam zaroori ho
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true // Email unique hona chahiye
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true // Phone number bhi unique hona chahiye
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: { // Yeh humne yahan professional tareeqe se add kiya hai
        type: Sequelize.ENUM('customer', 'admin', 'agent'),
        allowNull: false,
        defaultValue: 'customer'
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false // By default, user verified nahi hoga
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