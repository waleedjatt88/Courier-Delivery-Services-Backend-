
const db = require('../../models');
const { User, BookingParcel, Pricing, Media, Zone } = db; 
const { v4: uuidv4 } = require('uuid');
const sendEmail = require('./notification.service.js');
const invoiceService = require('./invoice.service.js');
const stripeService = require('./payment.service.js'); 
const { Op } = require('sequelize');
const { validatePickupSlot } = require('../utils/validators.js');


const prepareManualCheckout = async (customerData, parcelData) => {
   const { fullName, email, phoneNumber } = customerData;

let customer = await User.findOne({ where: { email } });

if (!fullName || !email || !phoneNumber) {
  throw new Error("Guest customer's full name, email, and phone number are required.");
}

const phoneRegex = /^03\d{9}$/;
if (!phoneRegex.test(phoneNumber)) {
  throw new Error("Invalid phone number format. It must be 11 digits and start with 03 (e.g., 03xxxxxxxxx).");
}

const allowedDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
const emailDomain = email.split('@')[1]?.toLowerCase();
if (!allowedDomains.includes(emailDomain)) {
  throw new Error("Only Gmail, Hotmail, Yahoo, and Outlook emails are allowed for guest customers.");
}

if (customer) {
  if (customer.role !== 'guest') {
    throw new Error("This email is already registered with a non-guest account. Manual booking not allowed.");
  }

  
} else {
  customer = await User.create({
    fullName,
    email,
    phoneNumber,
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

     if (deliveryType === 'scheduled') {
        const [pickupDate, pickupTime] = pickupSlot.split(' ');
        validatePickupSlot(pickupDate, pickupTime);
    }

   if (!pickupZoneId || !deliveryZoneId || !deliveryType) {
       throw new Error(
         "Pickup zone, Delivery zone, and Delivery Type are required."
       );
     }
     if (deliveryType === "scheduled" && !pickupSlot) {
       throw new Error("Pickup Slot is required for scheduled delivery.");
     }
   
     if (packageWeight > 50) {
         throw new Error("Maximum weight limit is 50kg. Please contact support for heavier parcels.");
     }
     const pickupPricing = await db.Pricing.findOne({
       where: { zoneId: pickupZoneId },
     });
     const deliveryPricing = await db.Pricing.findOne({
       where: { zoneId: deliveryZoneId },
     });
   
     if (!pickupPricing || !deliveryPricing) {
       throw new Error("Invalid zone provided. Pricing not available.");
     }
   
     let totalCharge = 0;
     if (pickupZoneId === deliveryZoneId) {
       totalCharge = pickupPricing.baseFare;
     } else {
       totalCharge = pickupPricing.baseFare + deliveryPricing.baseFare;
     }
     if (packageWeight > 5) {
         const weightSlab = await db.WeightSlab.findOne({
             where: {
                 minWeight: { [Op.lt]: packageWeight }, 
                 maxWeight: { [Op.gte]: packageWeight } 
             }
         });
         if (weightSlab) {
             totalCharge += weightSlab.charge;
         } else if (packageWeight <= 50) { 
             console.warn(`No weight slab found for weight: ${packageWeight}kg. Extra weight charge not applied.`);
         }}
     if (deliveryType === "instant") {
       const expressPercent =
         (pickupPricing.expressChargePercent +
           deliveryPricing.expressChargePercent) /
         2;
       if (expressPercent > 0) {
           totalCharge *= 1 + expressPercent / 100;
       }}
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

      const customer = parcel.Customer;
    if (customer && customer.role === 'guest') {
        const updates = {};
        if (customerDataToUpdate.phoneNumber && customer.phoneNumber !== customerDataToUpdate.phoneNumber) {
            updates.phoneNumber = customerDataToUpdate.phoneNumber;
        }
        if (customerDataToUpdate.fullName && customer.fullName !== customerDataToUpdate.fullName) {
            updates.fullName = customerDataToUpdate.fullName;
        }

        if (Object.keys(updates).length > 0) {
            await customer.update(updates);
            console.log(`Guest customer ${customer.id} details updated.`);
        }
    }


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
    }};

const sendPaymentLink = async (parcelId) => {
    const parcel = await BookingParcel.findOne({ where: { id: parcelId, status: 'unconfirmed' }, include: ['Customer'] });
    if (!parcel) throw new Error("Invalid parcel or parcel already confirmed.");
    const paymentIntentMetadata = {};
    if (parcel.Customer.role === 'guest') {
        paymentIntentMetadata.update_guest_name = customerData.fullName;
        paymentIntentMetadata.update_guest_phone = customerData.phoneNumber;
        paymentIntentMetadata.guest_customer_id = parcel.Customer.id;
    }
    const session = await stripeService.createCheckoutSession(parcel.id, parcel.customerId, paymentIntentMetadata);
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