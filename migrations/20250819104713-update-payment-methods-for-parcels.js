'use strict';
module.exports = { 
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TYPE "public"."enum_BookingParcels_paymentMethod" ADD VALUE \'STRIPE\';'
    );
  },

  async down(queryInterface, Sequelize) {
    
    console.log("Warning: Removing an ENUM value (STRIPE) is a complex manual operation and has been skipped in this rollback.");
    return Promise.resolve();
  }
};