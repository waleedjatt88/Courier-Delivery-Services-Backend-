const chatService = require('../services/chat.service.js');

const getCustomerChatHistory = async (req, res) => {
    try {
        const customerId = req.params.customerId; 
        const requesterId = req.user.id; 
        const requesterRole = req.user.role; 

        const messages = await chatService.getChatHistory(customerId, requesterId, requesterRole);
        res.status(200).json({ messages });
    } catch (error) {
        if (error.message.includes('Forbidden')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to fetch chat history.' });
    }
};

const clearMyChat = async (req, res) => {
    try {
        const customerId = req.user.id;
        const result = await chatService.clearChatForCustomer(customerId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed to clear chat history." });
    }
};

module.exports = {
    getCustomerChatHistory,
    clearMyChat
};