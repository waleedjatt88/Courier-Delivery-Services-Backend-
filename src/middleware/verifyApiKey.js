
const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key']; 

    if (!apiKey) {
        return res.status(401).json({ message: 'Unauthorized: API Key is missing.' });
    }

    if (apiKey !== process.env.CHATBOT_API_KEY) {
        return res.status(403).json({ message: 'Forbidden: Invalid API Key.' });
    }

    next();
};

module.exports = {
    verifyApiKey
};