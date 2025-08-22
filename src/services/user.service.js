
const db = require('../../models');
const User = db.User;


const getUserById = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: { exclude: ['passwordHash'] }
    });
    return user;
};


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


module.exports = {
    getUserById,
    updateUser,
};