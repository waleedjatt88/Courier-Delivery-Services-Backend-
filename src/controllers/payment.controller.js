// src/controllers/payment.controller.js

const paymentService = require('../services/payment.service.js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Controller to create a Stripe Checkout Session.
 */
const createCheckoutSession = async (req, res) => {
    try {
        const customerId = req.user.id;
        
        const { parcelId } = req.body;

        if (!parcelId) {
            return res.status(400).json({ message: "Parcel ID is required." });
        }

        const session = await paymentService.createCheckoutSession(parcelId, customerId);

        res.status(200).json(session);

    } catch (error) {
        console.error("Error creating Stripe session:", error);
        res.status(500).json({ message: "Failed to create payment session.", error: error.message });
    }
};

const stripeWebhook = (req, res) => {
    console.log("--- 1. Webhook request received! ---"); // Checkpoint 1

    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
        console.log("--- 2. Webhook signature VERIFIED! ---"); // Checkpoint 2
    } catch (err) {
        console.error(`!!! Webhook signature verification failed:`, err.message);
        return res.sendStatus(400);
    }
        console.log(`Received event of type: [${event.type}]`);


    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('--- 3. Event is checkout.session.completed. Calling service... ---'); // Checkpoint 3
        console.log('Session Metadata:', session.metadata); 

        
        paymentService.handleSuccessfulPayment(session)
            .then(() => console.log("--- 4. Service finished successfully. ---")) // Checkpoint 4
            .catch(err => console.error("!!! ERROR inside handleSuccessfulPayment service:", err));
    }

    res.json({ received: true });
};

module.exports = {
    createCheckoutSession,
    stripeWebhook 
};