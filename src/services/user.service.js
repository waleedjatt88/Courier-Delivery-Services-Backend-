
const db = require('../../models');
const { User, Media } = db;
const fs = require('fs').promises; 
const path = require('path');


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


const uploadProfilePicture = async (file, userId) => {
    if (!file) {
        throw new Error("No file was uploaded.");
    }

    const oldPicture = await Media.findOne({
        where: { relatedId: userId, relatedType: 'user', mediaType: 'PROFILE_PICTURE' }
    });

    if (oldPicture) {
        try {
            const oldPath = path.join(__dirname, '../../public', oldPicture.url);
            await fs.unlink(oldPath);
            console.log("Old profile picture file deleted from server.");
        } catch (err) {
            console.error("Could not delete old file, it might not exist:", err.message);
        }
        await oldPicture.destroy();
    }

    const newProfilePic = await Media.create({
        url: `/images/${file.filename}`, 
        mediaType: 'PROFILE_PICTURE',
        relatedId: userId,
        relatedType: 'user'
    });

    return newProfilePic;
};


const getProfilePicture = async (userId) => {
    const profilePic = await Media.findOne({
        where: { relatedId: userId, relatedType: 'user', mediaType: 'PROFILE_PICTURE' }
    });

    if (!profilePic) {
        throw new Error("No profile picture found for this user.");
    }
    return profilePic;
};


const deleteProfilePicture = async (userId) => {
    const profilePic = await Media.findOne({
        where: { relatedId: userId, relatedType: 'user', mediaType: 'PROFILE_PICTURE' }
    });

    if (!profilePic) {
        throw new Error("No profile picture to delete.");
    }
    
    try {
        const filePath = path.join(__dirname, '../../public', profilePic.url);
        await fs.unlink(filePath);
    } catch (err) {
        console.error("Could not delete file from server:", err.message);
    }
    
    await profilePic.destroy();

    return { message: "Profile picture deleted successfully." };
};


module.exports = {
    getUserById,
    updateUser,
    uploadProfilePicture,
    getProfilePicture,
    deleteProfilePicture
};