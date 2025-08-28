
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
    const uniquePart = uuidv4().split('-').pop().toUpperCase();
    const trackingNumber = `PK-${uniquePart}`;
    const baseCharge = 150;
    const chargePerKg = 50;
    const deliveryCharge = baseCharge + ((parcelData.packageWeight - 1) * chargePerKg);
    const { customerId: clientCustomerId, ...safeParcelData } = parcelData;

    let newParcel = await BookingParcel.create({
        ...safeParcelData,
        customerId: customerId,
        trackingNumber: trackingNumber,
        deliveryCharge: deliveryCharge,
        status: 'pending',
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

module.exports = {
    createParcel,
    getMyParcels,
    getAllParcels,
    getParcelById,
    assignAgentToParcel,
    getParcelsByAgentId ,
    getParcelFiles
};