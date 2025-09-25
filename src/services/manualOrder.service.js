
const db = require('../../models');
const { User, BookingParcel, Pricing, Media, Zone } = db; 
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
     const { 
        packageWeight, 
        deliveryType, 
        pickupZoneId, 
        deliveryZoneId, 
        pickupSlot 
    } = parcelData;

    if (!pickupZoneId || !deliveryZoneId || !deliveryType) {
            throw new Error("Pickup zone, Delivery zone, and Delivery Type are required.");
        }
        if (deliveryType === 'scheduled' && !pickupSlot) {
            throw new Error("Pickup Slot is required for scheduled delivery.");
        }
    
        
        const pickupPricing = await db.Pricing.findOne({ where: { zoneId: pickupZoneId } });
        const deliveryPricing = await db.Pricing.findOne({ where: { zoneId: deliveryZoneId } });
    
        if (!pickupPricing || !deliveryPricing) {
            throw new Error("Invalid zone provided. Pricing not available.");
        }
    
        let totalCharge = 0;
        if (pickupZoneId === deliveryZoneId) {
            totalCharge = pickupPricing.baseFare;
        } else {
            totalCharge = pickupPricing.baseFare + deliveryPricing.baseFare;
        }
    
        const weightThreshold = 5;
        if (packageWeight > weightThreshold) {
            const perKgCharge = (pickupPricing.perKgCharge + deliveryPricing.perKgCharge) / 2;
            const extraWeight = packageWeight - weightThreshold;
            totalCharge += extraWeight * perKgCharge;
        }
    
        if (deliveryType === 'instant') {
            const expressPercent = (pickupPricing.expressChargePercent + deliveryPricing.expressChargePercent) / 2;
            totalCharge *= (1 + (expressPercent / 100)); 
        }

    const trackingNumber = `PK-${uuidv4().split('-').pop().toUpperCase()}`;
    const parcel = await BookingParcel.create({
        ...parcelData,
        customerId: customer.id,
        deliveryCharge: Math.round(totalCharge),
        trackingNumber: trackingNumber,
        status: 'unconfirmed',
        paymentStatus: 'pending',
        bookingsource: 'manual' 
    });

    return { parcelId: parcel.id, totalCharges: parcel.deliveryCharge };
};



const confirmPayNow = async (parcelId) => {
    const parcel = await BookingParcel.findOne({ 
        where: { id: parcelId, status: 'unconfirmed' }, 
        include: [
            { model: User, as: 'Customer' }, 
            { model: Zone, as: 'PickupZone', attributes: ['name'] },
            { model: Zone, as: 'DeliveryZone', attributes: ['name'] }
        ] 
    });
    try {

    if (!parcel) throw new Error("Invalid parcel or parcel already confirmed.");

        parcel.paymentMethod = 'CASH';
        parcel.paymentStatus = 'completed';
        parcel.status = 'order_placed';
        await parcel.save();

        const invoiceUrl = invoiceService.generateBookingInvoice(parcel, parcel.Customer);
        await Media.create({ url: invoiceUrl, mediaType: 'BOOKING_INVOICE', relatedId: parcel.id, relatedType: 'parcel' });
        
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