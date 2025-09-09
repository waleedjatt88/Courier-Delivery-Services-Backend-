
const db = require('../../models');
const { User, BookingParcel, Pricing, Media } = db;
const { v4: uuidv4 } = require('uuid');
const sendEmail = require('./notification.service.js');
const invoiceService = require('./invoice.service.js');
const stripeService = require('./payment.service.js'); 


const prepareManualCheckout = async (customerData, parcelData) => {
    let customer = await User.findOne({ where: { email: customerData.email } });
    if (!customer) {
        customer = await User.create({
            ...customerData,
            role: 'guest',
            isVerified: true, 
            passwordHash: 'not_applicable'
        });
    }

    const pricingRule = await Pricing.findOne({ where: { zoneId: parcelData.zoneId } });
    if (!pricingRule) throw new Error("Pricing for the selected zone is not available.");
    
     let totalCharge = pricingRule.baseFare; 

    const weightThreshold = 5; 
    if (parcelData.packageWeight > weightThreshold) {
        const extraWeight = parcelData.packageWeight - weightThreshold;
        totalCharge += extraWeight * pricingRule.perKgCharge;
    }

    if (parcelData.deliveryType === 'instant') {
        const expressFee = totalCharge * (pricingRule.expressChargePercent / 100);
        totalCharge += expressFee;
    }

    const trackingNumber = `PK-${uuidv4().split('-').pop().toUpperCase()}`;
    const parcel = await BookingParcel.create({
        ...parcelData,
        customerId: customer.id,
        deliveryCharge: Math.round(totalCharge),
        trackingNumber: trackingNumber,
        status: 'unconfirmed',
        paymentStatus: 'pending',
        source: 'manual' 
    });

    return { parcelId: parcel.id, totalCharges: parcel.deliveryCharge };
};



const confirmPayNow = async (parcelId) => {
    try {
        const parcel = await BookingParcel.findOne({ where: { id: parcelId, status: 'unconfirmed' }, include: ['Customer'] });
        if (!parcel) throw new Error("Invalid parcel or parcel already confirmed.");

        parcel.paymentMethod = 'CASH';
        parcel.paymentStatus = 'completed';
        parcel.status = 'order_placed';
        await parcel.save();

        const invoiceUrl = invoiceService.generateInvoice(parcel, parcel.Customer);
        await Media.create({ url: invoiceUrl, mediaType: 'PARCEL_INVOICE', relatedId: parcel.id, relatedType: 'parcel' });
        
        await sendEmail({
            email: parcel.Customer.email,  
            subject: `Parcel Booked! Tracking ID: ${parcel.trackingNumber}`,
            template: 'parcelBooked',
            data: {
                customerName: parcel.Customer.fullName,
                trackingNumber: parcel.trackingNumber,
                status: parcel.status,
                pickupAddress: parcel.pickupAddress,
                deliveryAddress: parcel.deliveryAddress,
                deliveryCharge: parcel.deliveryCharge,
                paymentMethod: parcel.paymentMethod
            }           
        });
        
        return parcel;
    } catch (error) {
        console.error("!!! Invoice/Email Error on COD confirm:", error);
        throw error;  
    }
};


const sendPaymentLink = async (parcelId) => {
    const parcel = await BookingParcel.findOne({ where: { id: parcelId, status: 'unconfirmed' }, include: ['Customer'] });
    if (!parcel) throw new Error("Invalid parcel or parcel already confirmed.");

    const session = await stripeService.createCheckoutSession(parcel.id, parcel.customerId);
    
   await sendEmail({
        email: parcel.Customer.email,
        subject: `Payment Required for Your Order #${parcel.trackingNumber}`,
        template: 'paymentLink', 
        data: {
            customerName: parcel.Customer.fullName,
            trackingNumber: parcel.trackingNumber,
            totalCharges: parcel.deliveryCharge,
            paymentUrl: session.checkoutUrl 
        }
    });

    return { message: "Payment link has been sent to the customer." };
};

module.exports = {
    prepareManualCheckout,
    confirmPayNow,
    sendPaymentLink
};