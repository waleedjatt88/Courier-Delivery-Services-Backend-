const db = require('../../models');
const User = db.User;


const getAllUsers = async () => {
    const users = await User.findAll({
        attributes: { exclude: ['passwordHash'] }
    });
    return users;
};


const deleteUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }
    await user.destroy();
    return { message: "User deleted successfully." };
};


const updateUser = async (userId, updateData) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }
    await user.update(updateData);
    return user;
};

const blockUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    user.isActive = false;
    await user.save();
    return user;
};

const unblockUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    user.isActive = true;
    await user.save();
    return user;
};


const suspendUser = async (userId, days) => {
    if (!days || days <= 0) {
        throw new Error("A positive number of days is required for suspension.");
    }
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    
    const suspensionEndDate = new Date();
    suspensionEndDate.setDate(suspensionEndDate.getDate() + parseInt(days, 10));
    
    user.suspendedUntil = suspensionEndDate;
    await user.save();
    return user;
};

const unsuspendUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    user.suspendedUntil = null; 
    await user.save();
    return user;
};

module.exports = {
    getAllUsers,
    deleteUser,
    updateUser,
    blockUser,
    unblockUser,
    suspendUser,
    unsuspendUser
};