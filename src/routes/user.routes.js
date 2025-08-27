const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller.js");
const { verifyToken, refreshCookie,} = require("../middleware/auth.middleware.js");
const uploadMiddleware = require('../middleware/upload.middleware.js');
router
  .route("/me")
  .get([verifyToken, refreshCookie], userController.getMyProfile)
  .patch([verifyToken, refreshCookie], userController.updateMyProfile)
  .put([verifyToken, refreshCookie], userController.updateMyProfile);

router.route('/me/profile-picture')
    .post([verifyToken, uploadMiddleware], userController.uploadProfilePicture) 
    .get([verifyToken], userController.getProfilePicture)
    .delete([verifyToken], userController.deleteProfilePicture); 

module.exports = router;
