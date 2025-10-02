'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * 'up' function 'Pages' table mein initial data daalega.
     */
    await queryInterface.bulkInsert('Pages', [
      {
        slug: 'about-us',
        title: 'About Our Company',
        content: JSON.stringify({
          "mainContent": "Welcome to DevGo Courier Service! We are dedicated to providing the best delivery experience."
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        slug: 'contact-us',
        title: 'Contact Us',
        content: JSON.stringify({
          "mainContent": "For any queries, feel free to reach out to us through the following channels.",
          "email": [
            "courier.delivery.service2025@gmail.com",
          ],
          "address": "123 Builtin-Soft, Punjab, Pakistan"
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        slug: 'terms-and-conditions',
        title: 'Terms and Conditions',
        content: JSON.stringify({
          "sections": [
            {
              "id": "sec_1",
              "title": "1. Our Commitment",
              "content": "We are committed to delivering your parcels safely and on time."
            },
            {
              "id": "sec_2",
              "title": "2. Prohibited Items",
              "content": "Users are not allowed to ship illegal, hazardous, or prohibited items through our service."
            },
            {
              "id": "sec_3",
              "title": "3.Shipping Policies ",
              "content": " Define how products are delivered, including shipping methods, costs, and delivery timelines."
            },

          ]
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * 'down' function 'Pages' table se is saare data ko hata dega.
     */
    await queryInterface.bulkDelete('Pages', {
      slug: {
        [Sequelize.Op.in]: ['about-us', 'contact-us', 'terms-and-conditions']
      }
    }, {});
  }
};
