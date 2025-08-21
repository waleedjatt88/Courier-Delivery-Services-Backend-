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

module.exports = {
    getAllUsers,
    deleteUser,
    updateUser 
};