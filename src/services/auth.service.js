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
    let isUserVerified = createdByAdmin;

    if (!createdByAdmin) {
        otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpExpires = new Date(Date.now() + 1 * 60 * 1000); 
    }

    const user = await User.create({
        fullName, email, phoneNumber, passwordHash,
        role: userRole,
        isVerified: isUserVerified, 
        otp: otp,
        otpExpires: otpExpires
    });
    
    if (!createdByAdmin) {
        try {
            
            const message = `
Hello ${user.fullName},

Welcome to DevGo Courier Service!

To complete your registration, please use the following One-Time Password (OTP):

Your OTP is: ${otp}

This code is valid for the next 1 minute.

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

    if (!user.isVerified) {
        throw new Error('Account not verified. Please check your email for the OTP to verify your account first.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        throw new Error('Invalid credentials - Password does not match');
    }

        const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } 
    );

    const userResult = user.toJSON();
    delete userResult.passwordHash;
    
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


const forgotPassword = async (email) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        console.log(`Password reset attempt for non-existent email: ${email}`);
        return { message: 'If a user with that email exists, an OTP has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 1 * 60 * 1000); 
    
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    try {
        
        const message = `
Hello,

We received a request to reset the password for your account.

Please use the following One-Time Password (OTP) to proceed:

Your OTP is: ${otp}

This OTP is valid for 1 minute.

Thank you for choosing us!
DevGo Courier Service Team.
`;
        await sendEmail({ email: user.email, subject: 'Courier App - Password Reset OTP', message });
    } catch (error) {
        throw new Error('Email could not be sent. Please try again later.');
    }
    
    return { message: 'An OTP has been sent to your email address.' };
};


const verifyPasswordResetOtp = async (email, otp) => {
    const user = await User.findOne({ 
        where: { email, otp, otpExpires: { [db.Sequelize.Op.gt]: new Date() } } 
    });

    if (!user) {
        throw new Error('Invalid or expired OTP.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); 
    
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    return { resetToken: resetToken };
};


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
    
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    
    await user.save();

    return { message: 'Password has been reset successfully.' };
};

const resendOtp = async (email) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return { message: 'If an account with that email exists, a new OTP has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 1 * 60 * 1000); 

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    try {
        const message = `You requested a new OTP. Your new One-Time Password is: ${otp}\nThis OTP is valid for 1 minute.`;
        await sendEmail({
            email: user.email,
            subject: 'Your New OTP Code',
            message: message
        });
    } catch (error) {
        throw new Error('Email could not be sent. Please try again.');
    }
    
    return { message: 'A new OTP has been sent to your email address.' };
};

module.exports = {
    register,
    login,
    verifyOtp, 
    forgotPassword, 
    verifyPasswordResetOtp, 
    resetPassword ,
    resendOtp
};