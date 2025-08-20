// src/routes/payment.routes.js

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller.js');
const { verifyToken, refreshCookie } = require('../middleware/auth.middleware.js');


router.post('/create-checkout-session', [verifyToken, refreshCookie], paymentController.createCheckoutSession);

// Stripe webhook needs raw body
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

// For testing webhook locally with Stripe CLI
// stripe listen --forward-to localhost:3000/api/payments/webhook

module.exports = router;