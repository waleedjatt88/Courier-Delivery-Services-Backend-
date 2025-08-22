'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'isActive', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true 
    });
    
    
    await queryInterface.addColumn('Users', 'suspendedUntil', {
      type: Sequelize.DATE,
      allowNull: true, 
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'isActive');
    await queryInterface.removeColumn('Users', 'suspendedUntil');
  }
};