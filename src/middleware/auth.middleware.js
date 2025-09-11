const jwt = require('jsonwebtoken');
const { blacklistedTokens } = require("../controllers/auth.controller.js");



const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided." });

  if (blacklistedTokens.has(token)) {
    return res.status(401).json({ message: "Token has been revoked. Please login again." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admin role required." });
    }
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
    isAgent
};
