
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller.js');
const { verifyToken, refreshCookie } = require('../middleware/auth.middleware.js'); 

router.route('/me')
    .get([verifyToken, refreshCookie], userController.getMyProfile)
    .patch([verifyToken, refreshCookie], userController.updateMyProfile)
    .put([verifyToken, refreshCookie], userController.updateMyProfile)

module.exports = router;