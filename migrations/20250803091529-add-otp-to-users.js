'use strict';
module.exports = { // Agar aapka project ES module hai to isko 'export default' karein
  async up(queryInterface, Sequelize) {
    // 'otp' column add karo
    await queryInterface.addColumn('Users', 'otp', {
      type: Sequelize.STRING,
      allowNull: true // Yeh optional hai, sirf zaroorat ke waqt istemal hoga
    });
    // 'otpExpires' column add karo
    await queryInterface.addColumn('Users', 'otpExpires', {
      type: Sequelize.DATE,
      allowNull: true // Yeh bhi optional hai
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'otp');
    await queryInterface.removeColumn('Users', 'otpExpires');
  }
};