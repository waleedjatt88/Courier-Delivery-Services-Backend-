
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
    
    const parcel = await db.BookingParcel.findByPk(parcelId);

    if (parcel && parcel.paymentStatus !== 'completed') {

        try {
            const oldInvoice = await db.Media.findOne({
                where: { relatedId: parcelId, relatedType: 'parcel', mediaType: 'PARCEL_INVOICE' }
            });
            if (oldInvoice) {
                const oldPath = path.join(__dirname, '../../public', oldInvoice.url);
                await fs.unlink(oldPath); 
                await oldInvoice.destroy();
                console.log(`Old unpaid invoice for parcel ${parcelId} deleted.`);
            }
        } catch (err) {
            console.error("Error deleting old invoice:", err.message);
        }

        parcel.paymentStatus = 'completed';
        await parcel.save();
        await parcel.reload(); 
        console.log(`✅ Parcel ID: ${parcelId} payment status updated to 'completed'.`);

        try {
            const customer = await db.User.findByPk(customerId);
            if (customer) {
                const newInvoiceUrl = invoiceService.generateInvoice(parcel, customer);
                await db.Media.create({
                    url: newInvoiceUrl,
                    mediaType: 'PARCEL_INVOICE',
                    relatedId: parcelId,
                    relatedType: 'parcel'
                });
                console.log(`New PAID invoice generated for parcel ${parcelId}.`);
            }
        } catch (invoiceError) {
            console.error("!!! Error generating new paid invoice:", invoiceError);
        }

        try {
            const customer = await db.User.findByPk(customerId);
            if (customer) {
                await sendEmail({
                    email: customer.email,
                    subject: `Payment Received! Your order #${parcel.trackingNumber} is confirmed.`,
                    template: 'paymentSuccess',
                    data: {
                        customerName: customer.fullName,
                        trackingNumber: parcel.trackingNumber,
                        paymentDate: new Date().toLocaleDateString('en-GB'),
                        amountPaid: parcel.deliveryCharge
                    }
                });
                console.log(`Payment success email sent to ${customer.email}`);
            }
        } catch (emailError) {
            console.error("!!! Could not send payment success email:", emailError);
        }

    } else {
        if (!parcel) {
            console.error(`Webhook Error: Parcel with ID ${parcelId} not found.`);
        } else {
            console.log(`Webhook Info: Received event for already paid parcel ID: ${parcelId}. Ignoring.`);
        }
    }
};


module.exports = {
    createCheckoutSession,
    handleSuccessfulPayment
};