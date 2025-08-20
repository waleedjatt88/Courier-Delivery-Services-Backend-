
const userService = require('../services/user.service.js');

const getUserById = async (req, res) => {
    try {
       
        if (req.user.role !== 'admin' && req.user.id.toString() !== req.params.id) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to view this profile." });
        }

        const user = await userService.getUserById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

// Controller to update a user's own information (with security check)
const updateUser = async (req, res) => {
    try {
        
        if (req.user.role !== 'admin' && req.user.id.toString() !== req.params.id) {
            return res.status(403).json({ message: "Forbidden: You can only update your own profile." });
        }

        if (req.user.role !== 'admin' && req.body.role) {
            delete req.body.role; 
        }

        const updatedUser = await userService.updateUser(req.params.id, req.body);

        res.status(200).json({ 
            message: "User updated successfully", 
            user: updatedUser 
        });
        
    } catch (error) {
        if (error.message.includes("User not found")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

const deleteMyProfile = async (req, res) => {
    try {

        
        if (req.user.role === 'agent') {
            return res.status(403).json({ message: "Forbidden: Agents are not allowed to delete their own profile." });
        }

        await userService.deleteMyProfile(req.user.id);
        res.status(200).json({ message: "Your profile was deleted successfully." });

    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

module.exports = {
    getUserById,
    updateUser,
    deleteMyProfile 
};