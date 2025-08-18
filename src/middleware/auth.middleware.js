// src/middleware/auth.middleware.js - UPDATED FOR COOKIES

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Step 1: Token ko 'jwt' naam ki cookie se nikalo
    const token = req.cookies.jwt;

    // Step 2: Check karo ki token mila ya nahi
    if (!token) {
        // Agar cookie mein token nahi hai, to user logged-in nahi hai
        return res.status(401).json({ message: "Not authorized, no token provided." });
    }

    // Step 3: Agar token mila hai, to use verify karo
    try {
        // Token ko hamari secret key se verify karo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Decoded information (user ki ID aur role) ko request ke sath laga do
        req.user = decoded;
        
        // Request ko aage controller tak jaane do
        next();

    } catch (err) {
        // Agar token ghalat hai ya expire ho gaya hai, to error do
        return res.status(401).json({ message: "Not authorized, token failed." });
    }
};

const isAdmin = (req, res, next) => {
    // Yeh function ab bhi waise hi kaam karega, kyunki 'verifyToken' pehle hi 
    // req.user mein user ki details daal chuka hoga.
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admin role required." });
    }
};

const refreshCookie = (req, res, next) => {
    try {
        // Check karo ki user logged-in hai (verifyToken se req.user set hua hai)
        if (req.user) {
            // Purane token ke data (id, role) ko hi istemal karo
            const tokenPayload = { id: req.user.id, role: req.user.role };

            // Ek naya token banao
            const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
                expiresIn: '1h' // Nayi expiry: ab se 1 ghanta
            });
            
            // Is naye token ko cookie mein set karke wapas bhej do
            res.cookie('jwt', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000 // 1 ghante ki expiry (milliseconds mein)
            });
        }
    } catch (error) {
        console.error("Error refreshing cookie:", error);
    }
    // Is middleware ka kaam sirf cookie refresh karna hai, isliye yeh hamesha aage badhega,
    // chahe error aaye ya na aaye, taaki asli response na ruke.
    next();
};


const isAgent = (req, res, next) => {
    // Yeh function hamesha 'verifyToken' ke BAAD chalega
    if (req.user && req.user.role === 'agent') {
        // Agar user ka role 'agent' hai, to request ko aage jane do
        next();
    } else {
        // Agar role 'agent' nahi hai, to error bhej do
        res.status(403).json({ message: "Access denied. Agent role required." });
    }
};

module.exports = {
    verifyToken,
    isAdmin,
    isAgent, 
    refreshCookie
};