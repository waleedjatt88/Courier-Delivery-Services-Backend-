
'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../../models');
const sendEmail = require('./notification.service.js');
const invoiceService = require('./invoice.service.js');
const fs = require('fs').promises; 
const path = require('path');


const createCheckoutSession = async (parcelId, customerId) => {
    const parcel = await db.BookingParcel.findOne({
        where: { id: parcelId, customerId: customerId }
    });

    if (!parcel) {
        throw new Error('Parcel not found or you are not authorized.');
    }
    if (parcel.paymentStatus === 'completed') {
        throw new Error('This parcel has already been paid for.');
    }

    const line_items = [{
        price_data: {
            currency: 'pkr',
            product_data: {
                name: `Parcel Delivery: #${parcel.trackingNumber}`,
                description: `From: ${parcel.pickupAddress} | To: ${parcel.deliveryAddress}`
            },
            unit_amount: Math.round(parcel.deliveryCharge * 100), 
        },
        quantity: 1,
    }];

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: line_items,
        mode: 'payment',
        success_url: `http://localhost:5173/payment-success?parcel_id=${parcel.id}`,
        cancel_url: `http://localhost:5173/payment-failed?parcel_id=${parcel.id}`,
        metadata: { 
            parcelId: parcel.id,
            customerId: customerId
        }
    });
    console.log("Created Stripe Checkout Session:", session);

return { checkoutUrl: session.url };
};



const handleSuccessfulPayment = async (session) => {
    const parcelId = session.metadata.parcelId;
    const customerId = session.metadata.customerId;
    
    const parcel = await db.BookingParcel.findOne({ 
        where: { id: parcelId, status: 'unconfirmed' } 
    });

    if (parcel) {
        parcel.paymentMethod = 'STRIPE';
        parcel.paymentStatus = 'completed';
        parcel.status = 'order_placed'; 
        await parcel.save();
        
        console.log(`✅ Parcel ID: ${parcelId} has been confirmed and paid via Stripe.`);

        try {
            const customer = await db.User.findByPk(customerId);

            if (parcel.bookingsource === 'manual' && customer && customer.role === 'guest') {
                console.log(`Guest manual order detected for user: ${customer.email}`);
            }

            if (customer) {
                const invoiceUrl = invoiceService.generateInvoice(parcel, customer);
                
                await db.Media.create({
                    url: invoiceUrl,
                    mediaType: 'PARCEL_INVOICE',
                    relatedId: parcelId,
                    relatedType: 'parcel'
                });
                console.log(`Invoice generated for paid parcel ${parcelId}.`);

                await sendEmail({
                    email: customer.email,
                    subject: `Payment Received! Your order #${parcel.trackingNumber} is confirmed.`,
                    template: 'paymentSuccess',
                    data: {
                        customerName: customer.fullName || "Dear Customer",
                        trackingNumber: parcel.trackingNumber,
                        paymentDate: new Date().toLocaleDateString('en-GB'),
                        amountPaid: parcel.deliveryCharge
                    }
                });
                console.log(`Payment success email sent to ${customer.email}`);
            }
        } catch (error) {
            console.error("!!! Error during post-payment (invoice/email) processing:", error);
        }

    } else {
        console.log(`Webhook Info: Received event for a non-existent or already processed parcel ID: ${parcelId}. Ignoring.`);
    }
};

module.exports = {
    createCheckoutSession,
    handleSuccessfulPayment
};