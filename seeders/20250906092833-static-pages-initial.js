'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
   const existingPages = await queryInterface.sequelize.query(
          'SELECT "pageType" FROM "StaticPages"', 
          { type: Sequelize.QueryTypes.SELECT }
        );
        const existingPageTypes = existingPages.map(p => p.pageType);

    const pagesToInsert = [
      {
        pageType: 'about',
        title: 'About Us',
        content: 'We are a leading courier company providing reliable and fast delivery services across Pakistan.',
        email: null,
        address: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        pageType: 'contact',
        title: 'Contact Us',
        content: null,
        email: 'support@courier.com',
        address: '123 Main Street, Lahore, Pakistan',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        pageType: 'terms',
        title: 'Terms and Conditions',
        content: 'By using our courier service, you agree to our terms and conditions.',
        email: null,
        address: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
        ].filter(page => !existingPageTypes.includes(page.pageType));

    if (pagesToInsert.length > 0) {
      await queryInterface.bulkInsert('StaticPages', pagesToInsert, {});
      console.log(`✅ Inserted ${pagesToInsert.length} static pages.`);
    } else {
      console.log('ℹ️ All static pages already exist. No insertion needed.');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('StaticPages', null, {});
  }
};
