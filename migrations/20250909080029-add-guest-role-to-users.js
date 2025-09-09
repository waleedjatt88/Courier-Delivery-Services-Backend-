'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TYPE \"public\".\"enum_Users_role\" ADD VALUE 'guest';"
    );
  },
  async down(queryInterface, Sequelize) {
    console.log("Reverting 'guest' role addition is not straightforward and has been skipped.");
    return Promise.resolve();
  }
};