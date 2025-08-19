// src/routes/payment.routes.js

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller.js');
const { verifyToken, refreshCookie } = require('../middleware/auth.middleware.js');

// === NAYA ROUTE: CREATE A STRIPE CHECKOUT SESSION ===
// Yeh ek protected route hai, sirf logged-in user hi payment kar sakta hai.
// Final URL: POST /api/payments/create-checkout-session
router.post('/create-checkout-session', [verifyToken, refreshCookie], paymentController.createCheckoutSession);

module.exports = router;