const authService = require('../services/auth.service.js');
const jwt = require('jsonwebtoken');

const blacklistedTokens = new Set();

const register = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!/^\d{11}$/.test(phoneNumber)) {
            return res.status(400).json({ message: "Phone number must be numeric and exactly 11 digits (e.g. 03XXXXXXXXX)." });
        }

        const createdByAdmin = (req.user && req.user.role === 'admin');
        const user = await authService.register(req.body, createdByAdmin);
        res.status(201).json({ message: 'User registered! Please check your email for OTP.', user });
    } catch (error) {
        res.status(400).json({ message: 'Registration failed: ' + error.message });
    }
};

const login = async (req, res) => {
    try {
        const data = await authService.login(req.body);
        console.log(`User logged in: ${data.user.email} | Role: ${data.user.role}`);
        
        const token = jwt.sign(
            { 
                id: data.user.id, 
                role: data.user.role 
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: '7d'  
            }
        );

        res.status(200).json({
            message: 'Login successful!',
            token, 
            user: data.user
        });

    } catch (error) {
        res.status(401).json({ message: 'Login failed: ' + error.message });
    }
};

const sendOtp = async (req, res) => {
    try {
        const { email, type } = req.body;
        if (!email || !type) {
            return res.status(400).json({ message: "Email and type are required." });
        }

        if (!Object.values(authService.OtpType).includes(type)) {
            return res.status(400).json({ message: "Invalid OTP type specified." });
        }
        
        const result = await authService.sendOtp(email, type);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Error sending OTP: " + error.message });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp, type } = req.body;
        if (!email || !otp || !type) {
            return res.status(400).json({ message: "Email, OTP, and type are required." });
        }
        if (!Object.values(authService.OtpType).includes(type)) {
            return res.status(400).json({ message: "Invalid OTP type specified." });
        }
        if (!/^\d{6}$/.test(otp)) { 
            return res.status(400).json({ message: "Invalid OTP format." });
        }

        const result = await authService.verifyOtp(email, otp, type);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: "Verification failed: " + error.message });
    }
};

const resetPassword = async (req, res) => {
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

const logout = (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
        blacklistedTokens.add(token);
    }
    res.status(200).json({ message: "Logout successful, token expired." });
};



const googleCallback = (req, res) => {
    const user = req.user;

    const token = jwt.sign(
        { 
            id: user.id, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: '7d'  
        }
    );
    
    res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
};

module.exports = {
    blacklistedTokens,
    register,
    login,
    resetPassword,
    logout,
    googleCallback,
    sendOtp,
    verifyOtp
};
