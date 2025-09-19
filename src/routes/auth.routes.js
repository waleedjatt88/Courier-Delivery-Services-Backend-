
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js');
const passport = require('passport');
const { verifyToken } = require('../middleware/auth.middleware.js');



router.post('/login', authController.login);
router.post('/register', authController.register);


router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);


router.put('/reset-password', authController.resetPassword);
router.post('/logout', verifyToken, authController.logout);


router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',  passport.authenticate('google', { failureRedirect: '/login-failed', session: false }),
    authController.googleCallback 
);

module.exports = router;