// src/services/admin.service.js
const db = require('../../models');
const User = db.User;

/**
 * Retrieves all users from the database. (Admin only)
 */
const getAllUsers = async () => {
    const users = await User.findAll({
        attributes: { exclude: ['passwordHash'] }
    });
    return users;
};

/**
 * Deletes a user by their ID. (Admin only)
 */
const deleteUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }
    await user.destroy();
    return { message: "User deleted successfully." };
};

/**
 * Updates a user by their ID. (Admin only)
 */
const updateUser = async (userId, updateData) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }
    await user.update(updateData);
    return user;
};

module.exports = {
    getAllUsers,
    deleteUser,
    updateUser 
};