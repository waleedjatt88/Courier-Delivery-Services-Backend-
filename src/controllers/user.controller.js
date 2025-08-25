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
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;
    const user = await userService.getUserById(userId);

    if (user.profilePicture) {
      const oldPath = path.join(__dirname, "../uploads", user.profilePicture);
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.error("Error deleting old profile picture:", err);
      }
    }

    const relativePath = path.join("profile-pictures", req.file.filename);
    const updatedUser = await userService.updateUser(userId, {
      profilePicture: relativePath,
    });

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePictureUrl: `/api/uploads/${relativePath}`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to upload profile picture: " + error.message });
  }
};

const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);

    if (!user.profilePicture) {
      return res.status(404).json({ message: "No profile picture found" });
    }

    const filePath = path.join(__dirname, "../uploads", user.profilePicture);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error("Error deleting profile picture:", err);
    }

    await userService.updateUser(userId, { profilePicture: null });

    res.status(200).json({ message: "Profile picture deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete profile picture: " + error.message });
  }
};

const getProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);

    if (!user.profilePicture) {
      return res.status(404).json({ message: "No profile picture found" });
    }

    res.status(200).json({
      profilePictureUrl: `/api/uploads/${user.profilePicture}`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get profile picture: " + error.message });
  }
};

module.exports = {
  getUserById,
  updateUser,
  getMyProfile,
  updateMyProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getProfilePicture,
};
