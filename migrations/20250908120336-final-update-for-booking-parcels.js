'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        ALTER TYPE "public"."enum_BookingParcels_status" ADD VALUE IF NOT EXISTS 'scheduled';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  },
  async down(queryInterface, Sequelize) {
    console.log("Cannot easily revert ENUM value additions.");
    return Promise.resolve();
  }
};