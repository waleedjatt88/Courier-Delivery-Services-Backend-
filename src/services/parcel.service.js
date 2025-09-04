
'use strict';

const db = require('../../models'); 
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { BookingParcel, User, Media } = db;
const sendEmail = require('./notification.service.js');
const invoiceService = require('./invoice.service.js'); 



/**
 * 
 * @param {object} parcelData 
 * @param {number} customerId 
 * @returns {object} 
 */
const createParcel = async (parcelData, customerId) => {
    const { 
        pickupAddress, deliveryAddress, packageWeight, packageSize,
        packageContent, pickupSlot,specialInstructions, paymentMethod, 
        deliveryType, zoneId 
    } = parcelData;

    if (!zoneId || !deliveryType) {
        throw new Error("Zone and Delivery Type are required.");
    }
    if (deliveryType === 'scheduled' && !pickupSlot) {
        throw new Error("Pickup Slot is required for scheduled delivery.");
    }


    const pricingRule = await db.Pricing.findOne({ where: { zoneId: zoneId } });
    if (!pricingRule) {
        throw new Error("Pricing for the selected zone is not available. Please contact support.");
    }

    let totalCharge = pricingRule.baseFare; 


    const weightThreshold = 5; 
    if (packageWeight > weightThreshold) {
        const extraWeight = packageWeight - weightThreshold;
        totalCharge += extraWeight * pricingRule.perKgCharge;
    }

    if (deliveryType === 'instant') {
        const expressFee = totalCharge * (pricingRule.expressChargePercent / 100);
        totalCharge += expressFee;
    }


    const uniquePart = uuidv4().split('-').pop().toUpperCase();
    const trackingNumber = `PK-${uniquePart}`;

    let newParcel = await BookingParcel.create({
        pickupAddress, deliveryAddress, packageWeight, packageSize,
        packageContent, pickupSlot,specialInstructions, paymentMethod, deliveryType,
        customerId: customerId,
        trackingNumber: trackingNumber,
        deliveryCharge: Math.round(totalCharge), 
        status: 'order_placed', 
        paymentStatus: 'pending'
    });

    try {
        const pickupResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, { params: { address: newParcel.pickupAddress, key: process.env.GOOGLE_MAPS_API_KEY } });
        const deliveryResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, { params: { address: newParcel.deliveryAddress, key: process.env.GOOGLE_MAPS_API_KEY } });

        if (pickupResponse.data.results.length > 0 && deliveryResponse.data.results.length > 0) {
            const pickupCoords = pickupResponse.data.results[0].geometry.location;
            const deliveryCoords = deliveryResponse.data.results[0].geometry.location;

            newParcel.pickupLat = pickupCoords.lat;
            newParcel.pickupLng = pickupCoords.lng;
            newParcel.deliveryLat = deliveryCoords.lat;
            newParcel.deliveryLng = deliveryCoords.lng;
            
            await newParcel.save();
            await newParcel.reload(); 
        }
    } catch (geoError) {
        console.error("!!! Error during Geocoding API call:", geoError.message);
    }

     try {
        const customer = await User.findByPk(customerId);
        if (customer) {
            const invoiceUrl = invoiceService.generateInvoice(newParcel, customer);

            await Media.create({
                url: invoiceUrl,
                mediaType: 'PARCEL_INVOICE',
                relatedId: newParcel.id,
                relatedType: 'parcel'
            });
            console.log(`Invoice generated and saved for parcel ${newParcel.id}`);

            await sendEmail({
                email: customer.email,
                subject: `Parcel Booked! Your Tracking ID: ${newParcel.trackingNumber}`,
                template: 'parcelBooked',
                data: {
                    customerName: customer.fullName,
                    trackingNumber: newParcel.trackingNumber,
                    status: newParcel.status,
                    pickupAddress: newParcel.pickupAddress,
                    deliveryAddress: newParcel.deliveryAddress,
                    deliveryCharge: newParcel.deliveryCharge,
                    paymentMethod: newParcel.paymentMethod
                }
            });
            console.log(`Booking confirmation email sent to: ${customer.email}`);
        }
    } catch (error) {
        console.error("!!! Error during Invoice/Email generation:", error);
    }

    return newParcel;
};

/**
 * 
 * @param {number} customerId 
 * @returns {Array} 
 */
const getMyParcels = async (customerId) => {
    const parcels = await db.BookingParcel.findAll({
        where: {
            customerId: customerId 
        },
        order: [['createdAt', 'DESC']] 
    });
    return parcels;
};

/**
 * 
 * @returns {Array} 
 */
const getAllParcels = async () => {
    const parcels = await db.BookingParcel.findAll({
        order: [['createdAt', 'DESC']], 
        include: {
            model: db.User,
            as: 'Customer',
            attributes: ['id', 'fullName', 'email'] 
        }
    });
    return parcels;
};

/**
 * 
 * @param {number} parcelId 
 * @returns {object} 
 */
const getParcelById = async (parcelId) => {
    const parcel = await db.BookingParcel.findByPk(parcelId, {
    
        include: [
            {
                model: db.User,
                as: 'Customer',
                attributes: ['id', 'fullName', 'email', 'phoneNumber']
            },
            {
                model: db.User,
                as: 'Agent',
                attributes: ['id', 'fullName', 'email', 'phoneNumber']
            }
        ]
    });
    return parcel;
};

/**
 * 
 * @param {number} parcelId 
 * @param {number} agentId 
 * @returns {object} 
 */
const assignAgentToParcel = async (parcelId, agentId) => {
    const parcel = await db.BookingParcel.findByPk(parcelId);
    if (!parcel) {
        throw new Error("Parcel not found with this ID.");
    }

    if (parcel.status !== 'pending') {
        throw new Error(`This parcel cannot be assigned. Its status is already '${parcel.status}'.`);
    }

    const agent = await db.User.findByPk(agentId);
    if (!agent) {
        throw new Error("Agent not found with this ID.");
    }

    if (agent.role !== 'agent') {
        throw new Error(`User with ID ${agentId} is not a delivery agent.`);
    }

    parcel.agentId = agentId;
    parcel.status = 'scheduled'; 

    await parcel.save(); 

    return parcel;
};

/**
 * 
 * @param {number} agentId 
 * @returns {Array} 
 */
const getParcelsByAgentId = async (agentId) => {
    const parcels = await db.BookingParcel.findAll({
        where: {
            agentId: agentId
        },
        order: [['createdAt', 'ASC']], 
        include: {
            model: db.User,
            as: 'Customer', 
            attributes: ['fullName', 'phoneNumber']
        }
    });
    return parcels;
};

const getParcelFiles = async (parcelId, customerId) => {
    const parcel = await db.BookingParcel.findOne({ where: { id: parcelId, customerId: customerId } });
    if (!parcel) {
        throw new Error("Parcel not found or you are not authorized.");
    }

    const files = await db.Media.findAll({
        where: {
            relatedId: parcelId,
            relatedType: 'parcel'
        }
    });

    return files;
};

const updateParcelStatusByAgent = async (parcelId, agentId, newStatus) => {
    const parcel = await db.BookingParcel.findByPk(parcelId);
    if (!parcel) {
        throw new Error("Parcel not found.");
    }
    if (parcel.agentId !== agentId) {
        throw new Error("Forbidden: You are not authorized to update this parcel.");
    }
    const agentAllowedStatuses = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
    if (!agentAllowedStatuses.includes(newStatus)) {
        throw new Error(`Invalid status update. Agents can only set status to: ${agentAllowedStatuses.join(', ')}.`);
    }

    parcel.status = newStatus;
    await parcel.save();
    return parcel;
};

/**
 * 
 * @param {number} parcelId 
 * @returns {object} 
 */
const cancelParcelByAdmin = async (parcelId) => {
    const parcel = await db.BookingParcel.findByPk(parcelId);
    if (!parcel) {
        throw new Error("Parcel not found.");
    }

    if (parcel.status === 'delivered') {
        throw new Error("Cannot cancel a parcel that has already been delivered.");
    }

    parcel.status = 'cancelled';
    await parcel.save();


    return parcel;
};

/**
 * 
 * @param {number} parcelId 
 * @returns {object} 
 */
const rescheduleParcelByAdmin = async (parcelId) => {
    const parcel = await db.BookingParcel.findByPk(parcelId);
    if (!parcel) {
        throw new Error("Parcel not found.");
    }

    if (parcel.status !== 'cancelled') {
        throw new Error(`Only cancelled parcels can be rescheduled. This parcel's status is '${parcel.status}'.`);
    }
    parcel.status = 'order_placed';  
    parcel.agentId = null; 
    await parcel.save();
    return parcel;
};


module.exports = {
    createParcel,
    getMyParcels,
    getAllParcels,
    getParcelById,
    assignAgentToParcel,
    getParcelsByAgentId ,
    updateParcelStatusByAgent,
    getParcelFiles,
    cancelParcelByAdmin,
    rescheduleParcelByAdmin
};