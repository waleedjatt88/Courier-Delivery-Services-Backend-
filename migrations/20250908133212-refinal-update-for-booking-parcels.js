"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "BookingParcels" ALTER COLUMN "status" DROP DEFAULT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "BookingParcels"
      ALTER COLUMN "status"
      TYPE TEXT USING "status"::text;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_BookingParcels_status";
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_BookingParcels_status" AS ENUM (
        'unconfirmed',
        'order_placed', 
        'scheduled', 
        'picked_up', 
        'in_transit', 
        'out_for_delivery', 
        'delivered', 
        'cancelled'
      );
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "BookingParcels"
      ALTER COLUMN "status"
      TYPE "enum_BookingParcels_status"
      USING "status"::"enum_BookingParcels_status";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "BookingParcels"
      ALTER COLUMN "status"
      SET DEFAULT 'unconfirmed';
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "BookingParcels" ALTER COLUMN "status" DROP DEFAULT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "BookingParcels"
      ALTER COLUMN "status"
      TYPE TEXT USING "status"::text;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_BookingParcels_status";
    `);
  }
};
