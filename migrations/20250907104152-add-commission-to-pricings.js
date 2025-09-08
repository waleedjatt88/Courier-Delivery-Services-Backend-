'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Pricings', 'agentCommissionPercent', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 10.0 
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Pricings', 'agentCommissionPercent');
  }
};