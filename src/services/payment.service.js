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
     if (parcel.status === 'order_placed') {
        throw new Error('This order has already been confirmed via Cash on Delivery (COD).');
    }
    if (parcel.status !== 'unconfirmed') {
        throw new Error(`This parcel cannot be paid for as its current status is '${parcel.status}'.`);
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
    success_url: `http://localhost:3000/customer/payment?status=success&parcel_id=${parcel.id}`,
    cancel_url: `http://localhost:3000/customer/payment?status=failed&parcel_id=${parcel.id}`,
        metadata: { 
            parcelId: parcel.id,
            customerId: customerId
        },
         payment_intent_data: {
            metadata: paymentIntentMetadata
        }
    });
    console.log("Created Stripe Checkout Session:", session);

return { checkoutUrl: session.url };
};

const handleSuccessfulPayment = async (session) => {
    const parcelId = session.metadata.parcelId;
    const customerId = session.metadata.customerId;

    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
    const paymentIntentMetadata = paymentIntent.metadata;

    if (paymentIntentMetadata.update_guest_name && paymentIntentMetadata.guest_customer_id) {
        try {
            const guestUser = await db.User.findByPk(paymentIntentMetadata.guest_customer_id);
            if (guestUser && guestUser.role === 'guest') {
                await guestUser.update({
                    fullName: paymentIntentMetadata.update_guest_name,
                    phoneNumber: paymentIntentMetadata.update_guest_phone
                });
                console.log(`Guest user ${guestUser.id} details updated via webhook.`);
            }
        } catch (err) {
            console.error("Failed to update guest user from webhook metadata:", err);
        }
    }

    const parcel = await db.BookingParcel.findOne({ 
        where: { id: parcelId, status: 'unconfirmed' },
        include: [
            {
                model: db.Zone,
                as: 'PickupZone', 
                attributes: ['name'] 
            },
            {
                model: db.Zone,
                as: 'DeliveryZone', 
                attributes: ['name']
            }
        ]
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
    const invoiceUrl = invoiceService.generateBookingInvoice(parcel, customer);
                await db.Media.create({
                    url: invoiceUrl,
                    mediaType: 'BOOKING_INVOICE', 
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