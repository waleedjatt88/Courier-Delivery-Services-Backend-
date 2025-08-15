// src/services/user.service.js

const db = require('../../models');
const User = db.User;

/**
 * Retrieves a single user by their ID.
 */
const getUserById = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: { exclude: ['passwordHash'] }
    });
    return user;
};

/**
 * Updates a user's information by their ID.
 */
const updateUser = async (userId, updateData) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }

     if (updateData.role) {
        // ... aur naya role 'admin' ya 'agent' hai...
        if (updateData.role === 'admin' || updateData.role === 'agent') {
            // ... to 'isVerified' ko automatically 'true' kar do.
            updateData.isVerified = true;
        }
    }
    // Only update the user's own data. We'll add more security here later.
    const updatedUser = await user.update(updateData);
    return updatedUser;
};

const deleteMyProfile = async (userId) => {
    const user = await db.User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }
    // Agent ko delete hone se rokne ka check yahan bhi daal sakte hain
    if (user.role === 'agent') {
        throw new Error("Agents cannot delete their own profiles.");
    }
    await user.destroy();
    return { message: "Your profile has been deleted successfully." };
};

module.exports = {
    getUserById,
    updateUser,
    deleteMyProfile // Naye function ko export karein
};