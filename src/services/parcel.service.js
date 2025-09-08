
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
const prepareCheckout = async (parcelData, customerId) => {
    const { 
        pickupAddress, deliveryAddress, packageWeight, packageSize,
        packageContent, pickupSlot,specialInstructions, 
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

    const parcel = await BookingParcel.create({
        pickupAddress, deliveryAddress, packageWeight, packageSize,
        packageContent, pickupSlot,specialInstructions, deliveryType,
        customerId: customerId,
        trackingNumber: trackingNumber,
        deliveryCharge: Math.round(totalCharge), 
        status: 'unconfirmed', 
        paymentStatus: 'pending',
        zoneId: zoneId
    });
    return { 
        parcelId: parcel.id, 
        totalCharges: parcel.deliveryCharge 
    };
};
const confirmCodBooking = async (parcelId, customerId) => {
    let parcel = await BookingParcel.findOne({ where: { id: parcelId, customerId: customerId } });
    if (!parcel || parcel.status !== 'unconfirmed') {
        throw new Error("Invalid parcel or parcel has already been processed.");
    }

    parcel.paymentMethod = 'COD';
    parcel.status = 'order_placed';
    await parcel.save();


    try {
        const pickupResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, { params: { address: parcel.pickupAddress, key: process.env.GOOGLE_MAPS_API_KEY } });
        const deliveryResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, { params: { address: parcel.deliveryAddress, key: process.env.GOOGLE_MAPS_API_KEY } });

        if (pickupResponse.data.results.length > 0 && deliveryResponse.data.results.length > 0) {
            parcel.pickupLat = pickupResponse.data.results[0].geometry.location.lat;
            parcel.pickupLng = pickupResponse.data.results[0].geometry.location.lng;
            parcel.deliveryLat = deliveryResponse.data.results[0].geometry.location.lat;
            parcel.deliveryLng = deliveryResponse.data.results[0].geometry.location.lng;
            await parcel.save();
        }
    } catch (geoError) {
        console.error("!!! Geocoding Error on COD confirm:", geoError.message);
    }

    try {
        const customer = await User.findByPk(customerId);
        if (customer) {
            const invoiceUrl = invoiceService.generateInvoice(parcel, customer);
            await Media.create({
                url: invoiceUrl,
                mediaType: 'PARCEL_INVOICE',
                relatedId: parcel.id,
                relatedType: 'parcel'
            });
            
            await sendEmail({
                email: customer.email,
                subject: `Parcel Booked! Tracking ID: ${parcel.trackingNumber}`,
                template: 'parcelBooked',
                  data: {
                    customerName: customer.fullName,
                    trackingNumber: parcel.trackingNumber,
                    status: parcel.status,
                    pickupAddress: parcel.pickupAddress,
                    deliveryAddress: parcel.deliveryAddress,
                    deliveryCharge: parcel.deliveryCharge,
                    paymentMethod: parcel.paymentMethod
                }           
             });
        }
    } catch (error) {
        console.error("!!! Invoice/Email Error on COD confirm:", error);
    }
    
    await parcel.reload();
    return parcel;
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

    if (parcel.status !== 'order_placed') {
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
    parcel.status = 'order_placed'; 
     parcel.assignedAt = new Date(); 
    parcel.agentAcceptanceStatus = 'pending'; 

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
    const parcel = await db.BookingParcel.findOne({ where: { id: parcelId, agentId: agentId } });
    if (!parcel) throw new Error("Parcel not found or not assigned to you.");
    if (parcel.agentAcceptanceStatus !== 'accepted') throw new Error("You must accept the job first.");

    const agentAllowedStatuses = ['picked_up','in_transit', 'out_for_delivery', 'delivered'];
    if (!agentAllowedStatuses.includes(newStatus)) {
        throw new Error(`Invalid status update by agent.`);
    }

    if (newStatus === 'delivered' && !parcel.agentCommission) {
    const globalZone = await db.Zone.findOne({ where: { name: 'GLOBAL_SETTINGS' } });
    if (globalZone) {
        const globalPricingRule = await db.Pricing.findOne({ where: { zoneId: globalZone.id } });
        if (globalPricingRule) {
            parcel.agentCommission = parcel.deliveryCharge * (globalPricingRule.agentCommissionPercent / 100);
            }
        }
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

const acceptJobByAgent = async (parcelId, agentId) => {
    const parcel = await db.BookingParcel.findOne({ where: { id: parcelId, agentId: agentId } });
    if (!parcel) throw new Error("Parcel not found or not assigned to you.");

    if (new Date() > new Date(parcel.assignedAt.getTime() + 10 * 60 * 1000)) {
        parcel.agentAcceptanceStatus = 'rejected';
        parcel.agentRejectionReason = 'Auto-rejected: Timed out';
        parcel.agentId = null; 
        parcel.status = 'order_placed'; 
        await parcel.save();
        throw new Error("Acceptance time has expired. Job has been unassigned.");
    }

    parcel.agentAcceptanceStatus = 'accepted';
    parcel.status = 'scheduled'; 
    await parcel.save();
    return parcel;
};

const rejectJobByAgent = async (parcelId, agentId, reason) => {
    const parcel = await db.BookingParcel.findOne({ where: { id: parcelId, agentId: agentId } });
    if (!parcel) throw new Error("Parcel not found or not assigned to you.");

    parcel.agentAcceptanceStatus = 'rejected';
    parcel.agentRejectionReason = reason || 'No reason provided.';
    parcel.agentId = null; 
    parcel.status = 'order_placed'; 
    await parcel.save();

    return parcel;
};



module.exports = {
    prepareCheckout,
    confirmCodBooking,
    getMyParcels,
    getAllParcels,
    getParcelById,
    assignAgentToParcel,
    getParcelsByAgentId ,
    updateParcelStatusByAgent,
    getParcelFiles,
    cancelParcelByAdmin,
    rescheduleParcelByAdmin,
    acceptJobByAgent ,
    rejectJobByAgent
};