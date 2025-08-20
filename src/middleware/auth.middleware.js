
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = decoded;
        
        next();

    } catch (err) {
        return res.status(401).json({ message: "Not authorized, token failed." });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admin role required." });
    }
};

const refreshCookie = (req, res, next) => {
    try {
        if (req.user) {
            const tokenPayload = { id: req.user.id, role: req.user.role };

            const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
                expiresIn: '1h' 
            });
            
            res.cookie('jwt', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000 
            });
        }
    } catch (error) {
        console.error("Error refreshing cookie:", error);
    }
    
    next();
};


const isAgent = (req, res, next) => {
    if (req.user && req.user.role === 'agent') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Agent role required." });
    }
};

module.exports = {
    verifyToken,
    isAdmin,
    isAgent, 
    refreshCookie
};