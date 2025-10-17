
const paymentService = require('../services/payment.service.js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const createCheckoutSession = async (req, res) => {
    try {
        const customerId = req.user.id;
        
        const { parcelId, source } = req.body;

        if (!parcelId) {
            return res.status(400).json({ message: "Parcel ID is required." });
        }
        const session = await paymentService.createCheckoutSession(
            parcelId, 
            customerId, 
            {}, 
            source 
        );

        res.status(200).json(session);

    } catch (error) {
        console.error("Error creating Stripe session:", error);
        res.status(500).json({ message: "Failed to create payment session.", error: error.message });
    }
};

const stripeWebhook = (req, res) => {
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = JSON.parse(req.body.toString());
    } catch (err) {
        console.error("Webhook Error: Request body ko parse nahi kiya jaa saka.", err);
        return res.sendStatus(400);
    }
    if (event.type === 'checkout.session.completed') {
        console.log("--- Zaroori event mila: checkout.session.completed. Ab signature verify ki jaayegi... ---");
        try {            
            const verifiedEvent = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
            console.log("--- Webhook signature VERIFIED! ---"); 
            const session = verifiedEvent.data.object;
            paymentService.handleSuccessfulPayment(session)
                .then(() => console.log("--- Service ne payment ko successfully handle kar liya. ---")) 
                .catch(err => console.error("!!! Service ke andar error:", err));
        } catch (err) {
            console.error(`!!! Webhook signature verification FAILED:`, err.message);
            return res.sendStatus(400);
        }
    } else {
        console.log(`Received and ignored an event of type: [${event.type}]`);
    }
    res.json({ received: true });
};



module.exports = {
    createCheckoutSession,
    stripeWebhook ,
};