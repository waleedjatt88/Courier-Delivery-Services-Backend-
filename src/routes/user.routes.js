const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller.js");
const { verifyToken } = require("../middleware/auth.middleware.js");
const uploadMiddleware = require('../middleware/upload.middleware.js');

router
  .route("/me")
  .get(verifyToken, userController.getMyProfile)
  .patch(verifyToken, userController.updateMyProfile)
  .put(verifyToken, userController.updateMyProfile);

router
  .route('/me/profile-picture')
  .post([verifyToken, uploadMiddleware], userController.uploadProfilePicture)
  .get(verifyToken, userController.getProfilePicture)
  .delete(verifyToken, userController.deleteProfilePicture);

module.exports = router;
