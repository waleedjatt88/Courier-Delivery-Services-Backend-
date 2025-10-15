
const db = require('../../models');
const { User, Media } = db;
const fs = require('fs').promises; 
const path = require('path');


const getUserById = async (id) => {
  const user = await db.User.findByPk(id, {
    include: {
      model: db.Media,
      as: "ProfilePictures", 
      attributes: ["url", "mediaType"],
    },
    attributes: { exclude: ["passwordHash", "otp", "otpExpires", "refreshToken", "passwordResetToken", "passwordResetExpires"] },
  });
  return user;
};

const updateUser = async (userId, updateData, file) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }
    if (updateData.role) {
        if (updateData.role === 'admin' || updateData.role === 'agent') {
            updateData.isVerified = true;
        }}
    await user.update(updateData);
    if (file) {
        const oldPicture = await Media.findOne({
            where: { relatedId: userId, relatedType: 'user', mediaType: 'PROFILE_PICTURE' } 
        });
        if (oldPicture) {
            try {
                const relativePath = oldPicture.url.startsWith('/') ? oldPicture.url.substring(1) : oldPicture.url;
                const oldPath = path.join(__dirname, '../../public', relativePath);
                await fs.unlink(oldPath);
                console.log("Old profile picture file deleted from server.");
            } catch (err) {
                console.error("Could not delete old file, it might not exist:", err.message);
            }
            await oldPicture.destroy();}
        await Media.create({
            url: `/images/${file.filename}`, 
            mediaType: 'PROFILE_PICTURE',
            relatedId: userId,
            relatedType: 'user'
        });
    }
    const updatedUserWithDetails = await getUserById(userId);
    return updatedUserWithDetails;
};

module.exports = {
    getUserById,
    updateUser,
};