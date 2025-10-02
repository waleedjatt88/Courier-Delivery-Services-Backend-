'use strict';
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.dropTable('StaticPages');
  },
  async down (queryInterface, Sequelize) {
    // Yeh code aapke puraane staticpage.model.js se liya gaya hai
    await queryInterface.createTable('StaticPages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      pageType: { type: Sequelize.STRING, allowNull: false, unique: true },
      title: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT },
      email: { type: Sequelize.STRING },
      address: { type: Sequelize.TEXT },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  }
};