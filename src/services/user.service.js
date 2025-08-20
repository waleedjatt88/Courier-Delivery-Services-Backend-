
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
        
        if (updateData.role === 'admin' || updateData.role === 'agent') {
        
            updateData.isVerified = true;
        }
    }
    
    const updatedUser = await user.update(updateData);
    return updatedUser;
};

const deleteMyProfile = async (userId) => {
    const user = await db.User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }
    if (user.role === 'agent') {
        throw new Error("Agents cannot delete their own profiles.");
    }
    await user.destroy();
    return { message: "Your profile has been deleted successfully." };
};

module.exports = {
    getUserById,
    updateUser,
    deleteMyProfile
};