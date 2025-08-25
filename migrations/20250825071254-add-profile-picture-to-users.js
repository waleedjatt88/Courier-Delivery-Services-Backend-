'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'profilePicture', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      comment: 'Path to user profile picture'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'profilePicture');
  }
};