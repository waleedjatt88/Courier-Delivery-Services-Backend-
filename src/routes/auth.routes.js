
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js');
const passport = require('passport');


router.post('/login', authController.login);

router.post('/register', authController.register);

router.post('/verify-otp', authController.verifyOtp);




router.post('/forgot-password', authController.forgotPassword);

router.post('/verify-password-otp', authController.verifyPasswordResetOtp);

router.put('/reset-password', authController.resetPassword);
router.post('/resend-otp', authController.resendOtp);


router.post('/logout', authController.logout);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login-failed', session: false }),
    authController.googleCallback 
);



module.exports = router;