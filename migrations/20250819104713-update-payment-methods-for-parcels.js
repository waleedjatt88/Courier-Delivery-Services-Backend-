'use strict';
module.exports = { // Ya 'export default'
  async up(queryInterface, Sequelize) {
    // ENUM list ko update karo taaki usmein 'STRIPE' bhi shaamil ho
    await queryInterface.changeColumn('BookingParcels', 'paymentMethod', {
      type: Sequelize.ENUM('COD', 'JAZZCASH', 'STRIPE'),
      allowNull: true // Ya false, aapki marzi
    });
  },

  async down(queryInterface, Sequelize) {
    // Undo karne ke liye, wapas purani list par le jao
    await queryInterface.changeColumn('BookingParcels', 'paymentMethod', {
      type: Sequelize.ENUM('COD', 'JAZZCASH')
    });
  }
};