
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js');


router.post('/register', authController.register);

router.post('/verify-otp', authController.verifyOtp);

router.post('/login', authController.login);



router.post('/forgot-password', authController.forgotPassword);

router.post('/verify-password-otp', authController.verifyPasswordResetOtp);

router.put('/reset-password', authController.resetPassword);
router.post('/resend-otp', authController.resendOtp);


router.post('/logout', authController.logout);



module.exports = router;