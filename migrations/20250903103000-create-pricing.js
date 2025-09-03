'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Pricings', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      zoneId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Zones', key: 'id' },
        onDelete: 'CASCADE'
      },
      baseFare: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      perKgCharge: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 100 },
      expressChargePercent: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 20 },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Pricings');
  }
};