const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller.js");
const { verifyToken } = require("../middleware/auth.middleware.js");
const upload = require('../middleware/upload.middleware.js');

router.route("/me")
  .get(verifyToken, userController.getMyProfile)
  .patch(
    verifyToken,
    upload.single('profilePicture'), 
    userController.updateMyProfile
  );

module.exports = router;