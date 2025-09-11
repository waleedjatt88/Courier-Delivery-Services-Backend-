const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware.js');

router.get('/my-history', verifyToken, (req, res) => {
    req.params.customerId = req.user.id;
    return chatController.getCustomerChatHistory(req, res);
});

router.get('/history/:customerId', [verifyToken, isAdmin], chatController.getCustomerChatHistory);

router.delete('/my-history', verifyToken, chatController.clearMyChat);

module.exports = router;
