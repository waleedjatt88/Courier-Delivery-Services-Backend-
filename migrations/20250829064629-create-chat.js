'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Chats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      adminId: {
        type: Sequelize.INTEGER,
        allowNull: true, 
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      sentBy: {
        type: Sequelize.ENUM('customer', 'admin'),
        allowNull: false
      },
      clearedByCustomer: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
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
    await queryInterface.dropTable('Chats');
  }
};