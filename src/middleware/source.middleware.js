
const setChatbotSource = (req, res, next) => {
    req.body.source = 'chatbot';
    next();
};

module.exports = {
    setChatbotSource
};