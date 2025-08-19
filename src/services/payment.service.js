// src/services/payment.service.js

console.log("Checking for Stripe Secret Key:", process.env.STRIPE_SECRET_KEY);


const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../../models');

/**
 * Creates a Stripe Checkout Session for a parcel booking.
 */
const createCheckoutSession = async (parcelId, customerId) => {
    // 1. Database se parcel ki details nikalo
    const parcel = await db.BookingParcel.findOne({
        where: { id: parcelId, customerId: customerId }
    });

    if (!parcel) {
        throw new Error('Parcel not found or you are not authorized.');
    }

    if (parcel.paymentStatus === 'completed') {
        throw new Error('This parcel has already been paid for.');
    }

    // 2. Stripe ke liye "line item" (product) tayyar karo
    const line_items = [{
        price_data: {
            currency: 'pkr', // Aap currency badal sakte hain
            product_data: {
                name: `Parcel Delivery: #${parcel.trackingNumber}`,
                description: `From: ${parcel.pickupAddress}\nTo: ${parcel.deliveryAddress}`
            },
            unit_amount: Math.round(parcel.deliveryCharge * 100), // Stripe amount ko paison mein leta hai
        },
        quantity: 1,
    }];

    // 3. Stripe Checkout Session banao
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: line_items,
        mode: 'payment',
        success_url: `http://your-frontend-app.com/payment-success?parcel_id=${parcel.id}`, // Payment kamyab hone par user yahan jayega
        cancel_url: `http://your-frontend-app.com/payment-failed?parcel_id=${parcel.id}`, // Payment fail hone par user yahan jayega
        metadata: { // Extra information jo humein webhook mein milegi
            parcelId: parcel.id,
            customerId: customerId
        }
    });

    // Frontend ko session ki ID wapas bhejo
    return { sessionId: session.id };
};


const handleSuccessfulPayment = async (session) => {
    console.log("--- 5. Inside handleSuccessfulPayment service. ---"); // Checkpoint 5
    const parcelId = session.metadata.parcelId;
    console.log(`--- 6. Got Parcel ID from metadata: ${parcelId} ---`); // Checkpoint 6

    if (!parcelId) {
        console.error("!!! FATAL: parcelId is missing from webhook metadata!");
        return; // Agar parcelId nahi hai to aage mat badho
    }

    const parcel = await db.BookingParcel.findByPk(parcelId);
    console.log(`--- 7. Searched for parcel in DB. Found:`, parcel ? 'Yes' : 'No'); // Checkpoint 7

    if (parcel) {
        parcel.paymentStatus = 'completed';
        await parcel.save();
        console.log(`✅ --- 8. Parcel ID: ${parcelId} has been updated in DB. ---`); // Checkpoint 8
    } else {
        console.error(`!!! Webhook Error: Parcel with ID ${parcelId} not found in DB.`);
    }
};
module.exports = {
    createCheckoutSession,
    handleSuccessfulPayment
};