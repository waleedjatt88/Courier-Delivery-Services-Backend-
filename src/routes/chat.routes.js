const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller.js');
const { verifyToken, isAdmin, refreshCookie } = require('../middleware/auth.middleware.js');

router.get('/my-history', [verifyToken, refreshCookie], (req, res) => {
    req.params.customerId = req.user.id;
    return chatController.getCustomerChatHistory(req, res);
});


router.get('/history/:customerId', [verifyToken, isAdmin, refreshCookie], chatController.getCustomerChatHistory);
router.delete('/my-history', [verifyToken, refreshCookie], chatController.clearMyChat);


module.exports = router;