const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller.js");
const {
  verifyToken,
  refreshCookie,
} = require("../middleware/auth.middleware.js");
const upload = require("../middleware/upload.middleware.js");

router
  .route("/me")
  .get([verifyToken, refreshCookie], userController.getMyProfile)
  .patch([verifyToken, refreshCookie], userController.updateMyProfile)
  .put([verifyToken, refreshCookie], userController.updateMyProfile);

router.post(
  "/me/profile-picture",
  [verifyToken, refreshCookie],
  upload.single("profilePicture"),
  userController.uploadProfilePicture
);
router.get(
  "/me/profile-picture",
  [verifyToken, refreshCookie],
  userController.getProfilePicture
);
router.delete(
  "/me/profile-picture",
  [verifyToken, refreshCookie],
  userController.deleteProfilePicture
);

module.exports = router;
