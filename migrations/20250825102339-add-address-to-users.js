'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'address', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: 'User address for profile'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'address');
  }
};