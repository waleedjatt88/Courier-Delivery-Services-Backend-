// src/services/auth.service.js - FINAL PRODUCTION-READY VERSION

const db = require('../../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('./notification.service.js');
const crypto = require('crypto');

const register = async (userData, createdByAdmin = false) => {
    const { fullName, email, phoneNumber, password, role } = userData;

    if (!fullName || !email || !password || !phoneNumber) {
        throw new Error('Full name, email, phone number, and password are required.');
    }
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
        throw new Error('User with this email already exists');
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    let userRole = 'customer';
    if (createdByAdmin && role && ['admin', 'agent', 'customer'].includes(role)) {
        userRole = role;
    }

     let otp = null;
    let otpExpires = null;
    // By default, 'isVerified' is true ONLY if created by an admin
    let isUserVerified = createdByAdmin;

    // Agar Admin user nahi bana raha hai (yaani public registration hai)...
    if (!createdByAdmin) {
        // ... to OTP banao
        otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    }

    // Database mein user create karo
    const user = await User.create({
        fullName, email, phoneNumber, passwordHash,
        role: userRole,
        isVerified: isUserVerified, // isVerified ki value yahan se aayegi
        otp: otp,
        otpExpires: otpExpires
    });
    
    // Email sirf tab bhejo jab Admin nahi bana raha
    if (!createdByAdmin) {
        try {
            // Naya, behtar message
            const message = `
Hello ${user.fullName},

Welcome to DevGo Courier Service!

To complete your registration, please use the following One-Time Password (OTP):

**Your OTP is: ${otp}**

This code is valid for the next 10 minutes.

Please enter this OTP in the app to verify your email address.

Thank you for choosing us!
DevGo Courier Service Team.

`;
            await sendEmail({ email: user.email, subject: 'Verify Your Email', message });
            console.log(`OTP email sent to: ${user.email}`);
        } catch (error) {
            console.error(`!!! Could not send OTP email to ${user.email}:`, error);
        }
    }
    const userResult = user.toJSON();
    delete userResult.passwordHash;
    delete userResult.otp;
    delete userResult.otpExpires;
    
    return userResult;
};

const login = async (loginData) => {
    const { email, password } = loginData;

    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new Error('Invalid credentials - User not found');
    }

    // === YAHAN NAYA SECURITY CHECK LAGAYA GAYA HAI ===
    if (!user.isVerified) {
        throw new Error('Account not verified. Please check your email for the OTP to verify your account first.');
    }
    // ===============================================

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        throw new Error('Invalid credentials - Password does not match');
    }

        const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } // Iski expiry ko hum har request par refresh karenge
    );
    // ------------------------------------

    const userResult = user.toJSON();
    delete userResult.passwordHash;
    
    // Sirf user aur ek hi token wapas bhejein
    return { user: userResult, token: token };
};


const verifyOtp = async (email, otp) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new Error("User not found.");
    }
    if (user.otp !== otp || user.otpExpires < new Date()) {
        throw new Error("Invalid or expired OTP.");
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return { message: "Email verified successfully. You can now log in." };
};

/**
 * Step 1: Forgot Password - User email deta hai aur use OTP milta hai.
 */
const forgotPassword = async (email) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        // User ko nahi batana ki email exist nahi karta (security reason)
        console.log(`Password reset attempt for non-existent email: ${email}`);
        return { message: 'If a user with that email exists, an OTP has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minute ki expiry
    
    // Purane reset token (agar koi hai) ko clear kar do
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    try {
        // Naya, behtar message
        const message = `
Hello,

We received a request to reset the password for your account.

Please use the following One-Time Password (OTP) to proceed:

**Your OTP is: ${otp}**

This OTP is valid for 10 minutes.

Thank you for choosing us!
DevGo Courier Service Team.
`;
        await sendEmail({ email: user.email, subject: 'Courier App - Password Reset OTP', message });
    } catch (error) {
        throw new Error('Email could not be sent. Please try again later.');
    }
    
    return { message: 'An OTP has been sent to your email address.' };
};

/**
 * Step 2: Verify Reset OTP - User OTP verify karta hai aur badle mein ek secure token haasil karta hai.
 */
const verifyPasswordResetOtp = async (email, otp) => {
    const user = await User.findOne({ 
        where: { email, otp, otpExpires: { [db.Sequelize.Op.gt]: new Date() } } 
    });

    if (!user) {
        throw new Error('Invalid or expired OTP.');
    }

    // Ek lamba, secure token banao jo sirf ek baar istemal ho sake
    const resetToken = crypto.randomBytes(32).toString('hex');

    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // Yeh token bhi 10 min ke liye valid hai
    
    // OTP ko clear kar do kyunki woh istemal ho chuka hai
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    // Frontend ko plain token wapas bhejo
    return { resetToken: resetToken };
};

/**
 * Step 3: Reset Password - User secure token aur naya password bhej kar password badalta hai.
 */
const resetPassword = async (resetToken, newPassword) => {
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
        where: {
            passwordResetToken: hashedToken,
            passwordResetExpires: { [db.Sequelize.Op.gt]: new Date() }
        }
    });

    if (!user) {
        throw new Error('Invalid or expired password reset token.');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Token ko istemal ke baad clear kar do
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    
    await user.save();

    return { message: 'Password has been reset successfully.' };
};


// =========================================================================
//  Exports ko Update Karein
// =========================================================================
module.exports = {
    register,
    login,
    verifyOtp, // Email verification ke liye
    forgotPassword, // Password reset Step 1
    verifyPasswordResetOtp, // Password reset Step 2
    resetPassword // Password reset Step 3
};