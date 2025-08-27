const userService = require("../services/user.service.js");
const upload = require("../middleware/upload.middleware.js");
const fs = require("fs").promises;
const path = require("path");

const getUserById = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.id.toString() !== req.params.id) {
      return res
        .status(403)
        .json({
          message: "Forbidden: You are not authorized to view this profile.",
        });
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

const updateUser = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.id.toString() !== req.params.id) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only update your own profile." });
    }

    if (req.user.role !== "admin" && req.body.role) {
      delete req.body.role;
    }

    const updatedUser = await userService.updateUser(req.params.id, req.body);

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error.message.includes("User not found")) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const userIdFromToken = req.user.id;

    const user = await userService.getUserById(userIdFromToken);

    if (!user) {
      return res
        .status(404)
        .json({ message: "User associated with token not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error: " + error.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const userIdFromToken = req.user.id;

    if (req.user.role !== "admin" && req.body.role) {
      delete req.body.role;
    }

    const updatedUser = await userService.updateUser(userIdFromToken, req.body);
    res.status(200).json({
      message: "Your profile was updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

const uploadProfilePicture = async (req, res) => {
    try {
        const media = await userService.uploadProfilePicture(req.file, req.user.id);
        res.status(200).json({ message: "Profile picture uploaded successfully.", data: media });
    } catch (error) {
        res.status(400).json({ message: "File upload failed.", error: error.message });
    }
};

const getProfilePicture = async (req, res) => {
    try {
        const media = await userService.getProfilePicture(req.user.id);
        res.status(200).json({ data: media });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

const deleteProfilePicture = async (req, res) => {
    try {
        const result = await userService.deleteProfilePicture(req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
  getUserById,
  updateUser,
  getMyProfile,
  updateMyProfile,
  uploadProfilePicture,
    getProfilePicture,
    deleteProfilePicture
};
