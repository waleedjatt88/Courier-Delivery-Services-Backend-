'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    
    try {
    
      const zones = await queryInterface.bulkInsert('Zones', [
        { name: 'Punjab', createdAt: new Date(), updatedAt: new Date() },
        { name: 'Sindh', createdAt: new Date(), updatedAt: new Date() },
        { name: 'KPK', createdAt: new Date(), updatedAt: new Date() },
        { name: 'Balochistan', createdAt: new Date(), updatedAt: new Date() },
      ], { returning: ['id'] }); 

      console.log('Successfully seeded Zones:', zones);

     
      await queryInterface.bulkInsert('Pricings', [
       
        { 
          zoneId: zones[0].id, 
          baseFare: 250, 
          perKgCharge: 100, 
          expressChargePercent: 20, 
          createdAt: new Date(), 
          updatedAt: new Date() 
        },
        { 
          zoneId: zones[1].id, 
          baseFare: 300, 
          perKgCharge: 120, 
          expressChargePercent: 25, 
          createdAt: new Date(), 
          updatedAt: new Date() 
        },
        { 
          zoneId: zones[2].id, 
          baseFare: 350, 
          perKgCharge: 150, 
          expressChargePercent: 20, 
          createdAt: new Date(), 
          updatedAt: new Date() 
        },
        { 
          zoneId: zones[3].id, 
          baseFare: 400, 
          perKgCharge: 180, 
          expressChargePercent: 20, 
          createdAt: new Date(), 
          updatedAt: new Date() 
        },
      ]);
      console.log('Successfully seeded Pricings.');

    } catch (error) {
      console.error('Error in seeding zones and pricing:', error);
    }
  },

  async down (queryInterface, Sequelize) {
    
    await queryInterface.bulkDelete('Pricings', null, {});
    await queryInterface.bulkDelete('Zones', null, {});
  }
};