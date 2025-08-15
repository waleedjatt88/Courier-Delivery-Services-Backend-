// src/controllers/admin.controller.js

const adminService = require('../services/admin.service.js');
const parcelService = require('../services/parcel.service.js');


// Controller to get all users (Admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await adminService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

// Controller to delete a user (Admin only)
const deleteUser = async (req, res) => {
    try {
        await adminService.deleteUser(req.params.id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        if (error.message.includes("User not found")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

//   Controller for Admin to get all parcels in the system.
 
const getAllParcels = async (req, res) => {
    try {
        const parcels = await parcelService.getAllParcels();
        res.status(200).json({ parcels: parcels });
    } catch (error) {
        console.error("Admin: Error fetching all parcels:", error);
        res.status(500).json({ message: "Failed to fetch parcels." });
    }
};



//  Controller for Admin to get a single parcel by its ID.

const getParcelById = async (req, res) => {
    try {
        const parcelId = req.params.id;
        const parcel = await parcelService.getParcelById(parcelId);
        
        if (!parcel) {
            return res.status(404).json({ message: "Parcel not found." });
        }

        res.status(200).json({ parcel: parcel });
    } catch (error) {
        console.error("Admin: Error fetching parcel by ID:", error);
        res.status(500).json({ message: "Failed to fetch parcel." });
    }
};

module.exports = {
    getAllUsers,
    deleteUser,
    getAllParcels,
    getParcelById 
};