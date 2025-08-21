
'use strict';

const db = require('../../models'); 
const { v4: uuidv4 } = require('uuid');

const { BookingParcel, User } = db; 

const sendEmail = require('./notification.service.js');


/**
 * Creates a new parcel booking and sends a confirmation email.
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

    const newParcel = await BookingParcel.create({
        ...safeParcelData, 
        customerId: customerId, 
        trackingNumber: trackingNumber,
        deliveryCharge: deliveryCharge,
        status: 'pending',
        paymentStatus: 'pending'
    });

   
    try {
        const customer = await User.findByPk(customerId);

        if (customer) {
            
            const message = `
Hello ${customer.fullName},

Thank you for booking with DevGo! Your parcel is confirmed and will be picked up soon.

**Booking Summary:**

- **Tracking Number:** ${newParcel.trackingNumber}
- **Status:** ${newParcel.status}

- **Pickup From:** ${newParcel.pickupAddress}
- **Deliver To:** ${newParcel.deliveryAddress}

- **Total Charges:** Rs. ${newParcel.deliveryCharge}
- **Payment Method:** ${newParcel.paymentMethod}

You can track your parcel's live status on our website using the tracking number.

Thanks for choosing DevGo!
            `;

            await sendEmail({
                email: customer.email,
                subject: `Parcel Booked! Your Tracking ID: ${newParcel.trackingNumber}`,
                message: message
            });
            console.log(`Booking confirmation email sent to: ${customer.email}`);
        }
    } catch (error) {
        console.error(`!!! Could not send booking confirmation email:`, error);
    }
   

    return newParcel;
};

/**
 * Retrieves all parcels for a specific customer.
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
 * Retrieves ALL parcels from the database. (Admin only)
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
 * Retrieves a single parcel by its ID. (For Admin and Customer)
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
 * Assigns a delivery agent to a specific parcel. (Admin only)
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
 * Retrieves all parcels assigned to a specific agent.
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

module.exports = {
    createParcel,
    getMyParcels,
    getAllParcels,
    getParcelById,
    assignAgentToParcel,
    getParcelsByAgentId 
};