
const db = require('../../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('./notification.service.js');
const crypto = require('crypto');

const OtpType = {
    EMAIL_VERIFICATION: 'email_verification',
    PASSWORD_RESET: 'password_reset',
  RESEND_OTP: 'resend_otp'  
};

const register = async (userData, createdByAdmin = false) => {
    const { fullName, email, phoneNumber, password, role } = userData;

    if (!fullName || !email || !password || !phoneNumber) {
        throw new Error('Full name, email, phone number, and password are required.');
    }
        const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Invalid phone number format. It must be 11 digits and start with 03 (e.g., 03xxxxxxxxx).');
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
        throw new Error('User with this email already exists');
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    let userRole = 'customer';
    if (createdByAdmin && role) {
        if (role === 'admin') {
            throw new Error('Admin cannot create another admin account');
        }
        if (['agent', 'customer'].includes(role)) {
            userRole = role;
        }
    }

    const user = await User.create({
        fullName, email, phoneNumber, passwordHash,
        role: userRole,
        isVerified: createdByAdmin, 
    });
    
    if (!createdByAdmin) {
        await sendOtp(email, OtpType.EMAIL_VERIFICATION);
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

    if (user.isActive === false) {
        throw new Error('Your account has been blocked. Please contact support.');
    }

    if (user.suspendedUntil && user.suspendedUntil > new Date()) {
        const suspensionEndDate = user.suspendedUntil.toLocaleString('en-PK', { 
            timeZone: 'Asia/Karachi' 
        });
        throw new Error(`Your account is suspended until ${suspensionEndDate}`);
    }

    if (!user.isVerified) {
        throw new Error('Please verify your account first. Check your email for OTP.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        throw new Error('Invalid credentials - Password does not match');
    }

    const token = jwt.sign(
        { 
            id: user.id, 
            role: user.role,
            email: user.email 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: '7d'  
        }
    );

    const userResult = user.toJSON();
    delete userResult.passwordHash;
    delete userResult.otp;
    delete userResult.otpExpires;
    delete userResult.passwordResetToken;
    delete userResult.passwordResetExpires;
    
    return { 
        user: userResult, 
        token: token 
    };
};



const sendOtp = async (email, type) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return { message: 'If an account with that email exists, an OTP has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 1 * 60 * 1000); 

    await user.save();

    let emailSubject = '';
    let emailTemplate = '';
    
    switch (type) {
        case OtpType.EMAIL_VERIFICATION:
            emailSubject = 'Verify Your Email for DevGo';
            emailTemplate = 'emailVerification';
            break;
        case OtpType.RESEND_OTP: 
            emailSubject = 'Your New DevGo OTP';
            emailTemplate = 'resendOtp'; 
            break;
        case OtpType.PASSWORD_RESET:
            emailSubject = 'Your DevGo Password Reset OTP';
            emailTemplate = 'forgotPassword';
            break;
        default:
            throw new Error('Invalid OTP type specified.');
    }
    
    try {
        await sendEmail({
            email: user.email,
            subject: emailSubject,
            template: emailTemplate, 
            data: { 
                fullName: user.fullName,
                otp: otp
            }
        });
    } catch (error) {
        console.error(`Could not send OTP email to ${user.email}:`, error);
        throw new Error('Email could not be sent. Please try again later.');
    }

    return { message: 'An OTP has been sent to your email address.' };
};


const verifyOtp = async (email, otp, type) => {
    const user = await User.findOne({ 
        where: { 
            email, 
            otp, 
            otpExpires: { [db.Sequelize.Op.gt]: new Date() } 
        } 
    });

    if (!user) {
        throw new Error('Invalid or expired OTP.');
    }

    user.otp = null;
    user.otpExpires = null;

    switch (type) {
            case OtpType.EMAIL_VERIFICATION:
            case OtpType.RESEND_OTP:
            user.isVerified = true;
            await user.save();
            return { message: "Email verified successfully. You can now log in." };

        case OtpType.PASSWORD_RESET:
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
            await user.save();
            return { resetToken: resetToken };

        default:
            throw new Error('Invalid OTP type specified.');
    }
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

module.exports = {
    register,
    login,
    resetPassword,
    sendOtp,
    verifyOtp,
    OtpType
};