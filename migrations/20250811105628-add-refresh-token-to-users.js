'use strict';
module.exports = { // Ya 'export default' aapke project ke hisab se
  async up(queryInterface, Sequelize) {
    // 'up' function batata hai ki "jab migrate karein, to yeh kaam karo"
    await queryInterface.addColumn('Users', 'refreshToken', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // 'down' function batata hai ki "jab undo karein, to iska ulta kaam karo"
    await queryInterface.removeColumn('Users', 'refreshToken');
  }
};