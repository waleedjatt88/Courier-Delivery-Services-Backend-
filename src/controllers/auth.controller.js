// src/controllers/auth.controller.js - MUKAMMAL UPDATED VERSION

const authService = require('../services/auth.service.js');

// =========================================================================
//  YEH FUNCTIONS PEHLE SE SAHI HAIN - Inmein koi badlaav nahi hai
// =========================================================================

exports.register = async (req, res) => {
    try {
        // === PHONE NUMBER VALIDATION ===
        const { phoneNumber } = req.body;
       if (!/^\d{11}$/.test(phoneNumber)) {
            return res.status(400).json({ message: "Phone number must be numeric and exactly 11 digits (e.g. 03XXXXXXXXX)." });
        }
        // ==============================

        const createdByAdmin = (req.user && req.user.role === 'admin');
        const user = await authService.register(req.body, createdByAdmin);
        res.status(201).json({ message: 'User registered! Please check your email for OTP.', user });
    } catch (error) {
        res.status(400).json({ message: 'Registration failed: ' + error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const data = await authService.login(req.body);
        console.log(`User logged in: ${data.user.email} | Role: ${data.user.role}`);

        res.cookie('jwt', data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 1000
        });

        res.status(200).json({
            message: 'Login successful!',
            user: data.user
        });

    } catch (error) {
        res.status(401).json({ message: 'Login failed: ' + error.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required." });
        }
        // === OTP VALIDATION ===
        if (!/^\d{4,8}$/.test(otp)) {
            return res.status(400).json({ message: "OTP must be numeric (4-8 digits)." });
        }
        // =====================

        const result = await authService.verifyOtp(email, otp);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: "Verification failed: " + error.message });
    }
};

// =========================================================================
//  FORGOT PASSWORD KE NAYE CONTROLLERS YAHAN HAIN
// =========================================================================

/**
 * Step 1 Controller: Forgot Password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error processing forgot password request: " + error.message });
  }
};

/**
 * Step 2 Controller: Verify Password Reset OTP
 */
exports.verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required." });
    }
    const result = await authService.verifyPasswordResetOtp(email, otp);
    res.status(200).json(result); // Yeh frontend ko 'resetToken' wapas dega
  } catch (error) {
    res.status(400).json({ message: "OTP verification failed: " + error.message });
  }
};

/**
 * Step 3 Controller: Reset Password
 */
exports.resetPassword = async (req, res) => {
    try {
        const { resetToken, password, confirmPassword } = req.body;

        if (!resetToken || !password || !confirmPassword) {
            return res.status(400).json({ message: "Reset token and new password are required."});
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        }

        const result = await authService.resetPassword(resetToken, password);
        res.status(200).json(result);

    } catch (error) {
        res.status(400).json({ message: "Password reset failed: " + error.message });
    }
};

exports.logout = (req, res) => {
    // 'jwt' naam ki cookie ko clear kar do
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0) // Cookie ko foran expire kar do
    });
    res.status(200).json({ message: "Logout successful" });
};