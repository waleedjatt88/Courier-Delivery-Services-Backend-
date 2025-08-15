// src/controllers/user.controller.js - FULLY SECURE AND UPDATED

const userService = require('../services/user.service.js');

// Controller to get a single user by ID (with security check)
const getUserById = async (req, res) => {
    try {
        // --- SECURITY CHECK ---
        // req.user humein verifyToken middleware se milta hai.
        // req.params.id humein URL (route parameter) se milta hai.

        // Agar user na to 'admin' hai, aur na hi woh apni ID maang raha hai, to error do.
        if (req.user.role !== 'admin' && req.user.id.toString() !== req.params.id) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to view this profile." });
        }
        // --- END OF SECURITY CHECK ---

        // Agar check pass ho gaya, to hi user ko dhoondo.
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
        // --- SECURITY CHECK ---
        // User sirf apni hi profile update kar sakta hai. Admin kisi ki bhi kar sakta hai.
        if (req.user.role !== 'admin' && req.user.id.toString() !== req.params.id) {
            return res.status(403).json({ message: "Forbidden: You can only update your own profile." });
        }
        // --- END OF SECURITY CHECK ---

        // Ek extra security check: Ek normal user apna role 'admin' nahi bana sakta.
        if (req.user.role !== 'admin' && req.body.role) {
            delete req.body.role; // Agar role bheja hai, to use ignore kar do.
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
        // Security Check: Token ki ID aur user ki ID same honi chahiye
        // req.user.id humein verifyToken se mil raha hai
        
        // Ek aur check: Kya role 'agent' hai?
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
    deleteMyProfile // Naye function ko export karein
};