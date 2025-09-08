"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const existingZones = await queryInterface.sequelize.query(
        'SELECT "id", "name" FROM "Zones"',
        { type: Sequelize.QueryTypes.SELECT }
      );
      const existingZoneNames = existingZones.map((z) => z.name);

      const zonesToInsert = [
        { name: "Punjab", createdAt: new Date(), updatedAt: new Date() },
        { name: "Sindh", createdAt: new Date(), updatedAt: new Date() },
        { name: "KPK", createdAt: new Date(), updatedAt: new Date() },
        { name: "Balochistan", createdAt: new Date(), updatedAt: new Date() },
        {
          name: "GLOBAL_SETTINGS",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ].filter((z) => !existingZoneNames.includes(z.name));

      let insertedZones = [];
      if (zonesToInsert.length > 0) {
        insertedZones = await queryInterface.bulkInsert(
          "Zones",
          zonesToInsert,
          { returning: ["id", "name"] }
        );
        console.log(`Inserted ${zonesToInsert.length} zones.`);
      } else {
        console.log("All zones already exist. No insertion needed.");
      }

      const allZones = [...existingZones, ...insertedZones];

      const existingPricings = await queryInterface.sequelize.query(
        'SELECT "zoneId" FROM "Pricings"',
        { type: Sequelize.QueryTypes.SELECT }
      );
      const existingZoneIds = existingPricings.map((p) => p.zoneId);

      const basePricingData = [
        { baseFare: 250, perKgCharge: 100, expressChargePercent: 20 },
        { baseFare: 300, perKgCharge: 120, expressChargePercent: 25 },
        { baseFare: 350, perKgCharge: 150, expressChargePercent: 20 },
        { baseFare: 400, perKgCharge: 180, expressChargePercent: 20 },
        {
          baseFare: 0,
          perKgCharge: 0,
          expressChargePercent: 0,
          agentCommissionPercent: 10.0,
        },
      ];


      const pricingsToInsert = allZones
        .filter((z) => !existingZoneIds.includes(z.id))
        .map((z) => {
          if (z.name === "GLOBAL_SETTINGS") {
            return {
              zoneId: z.id,
              baseFare: 0,
              perKgCharge: 0,
              expressChargePercent: 0,
              agentCommissionPercent: 10.0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }

          const index = allZones.indexOf(z) % (basePricingData.length - 1); // -1 to exclude the last item
          return {
            zoneId: z.id,
            ...basePricingData[index],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        });

      if (pricingsToInsert.length > 0) {
        await queryInterface.bulkInsert("Pricings", pricingsToInsert);
        console.log(`Inserted ${pricingsToInsert.length} pricings.`);
      } else {
        console.log("All pricings already exist. No insertion needed.");
      }
    } catch (error) {
      console.error("Error in seeding zones and pricing:", error);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Pricings", null, {});
    await queryInterface.bulkDelete("Zones", null, {});
  },
};
