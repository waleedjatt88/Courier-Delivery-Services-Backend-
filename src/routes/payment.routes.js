const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller.js');
const { verifyToken } = require('../middleware/auth.middleware.js');
const { setChatbotSource } = require('../middleware/source.middleware.js');




router.post('/create-checkout-session', verifyToken, paymentController.createCheckoutSession);
router.post( '/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);
router.post('/ai/create-checkout-session',verifyToken,setChatbotSource,paymentController.createCheckoutSession);




module.exports = router;

