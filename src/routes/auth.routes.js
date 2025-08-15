// src/routes/auth.routes.js - MUKAMMAL UPDATED VERSION

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js');

// ===================================================
//              REGISTRATION & LOGIN
// ===================================================

// Public user registration
router.post('/register', authController.register);

// Verify email after registration
router.post('/verify-otp', authController.verifyOtp);

// User login
router.post('/login', authController.login);


// ===================================================
//              FORGOT PASSWORD WORKFLOW
// ===================================================

// Step 1: User email bhejta hai aur OTP haasil karta hai
router.post('/forgot-password', authController.forgotPassword);

// Step 2: User OTP verify karke, badle mein ek secure 'resetToken' haasil karta hai
// YEH NAYA ROUTE HAI
router.post('/verify-password-otp', authController.verifyPasswordResetOtp);

// Step 3: User 'resetToken' aur naya password bhej kar password badalta hai
// YEH ROUTE UPDATE HUA HAI
router.put('/reset-password', authController.resetPassword);

router.post('/logout', authController.logout);



module.exports = router;