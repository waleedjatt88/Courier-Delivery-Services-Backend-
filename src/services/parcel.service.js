// src/services/parcel.service.js 

'use strict';

const db = require('../../models'); 
const { v4: uuidv4 } = require('uuid');

// db object ke andar se zaroori models nikalein
const { BookingParcel, User } = db; 

const sendEmail = require('./notification.service.js');


/**
 * Creates a new parcel booking and sends a confirmation email.
 * @param {object} parcelData - Data for the new parcel from the request body.
 * @param {number} customerId - The ID of the logged-in customer.
 * @returns {object} The newly created parcel object.
 */
const createParcel = async (parcelData, customerId) => {
    // --- Business Logic 1: Tracking Number Generate Karna ---
     const uniquePart = uuidv4().split('-').pop().toUpperCase(); 
    const trackingNumber = `PK-${uniquePart}`;

    // --- Business Logic 2: Delivery Charge Calculate Karna ---
    const baseCharge = 150; // Base rate (e.g., Rs. 150)
    const chargePerKg = 50; // Har extra kg par Rs. 50
    const deliveryCharge = baseCharge + ((parcelData.packageWeight - 1) * chargePerKg);
     const { customerId: clientCustomerId, ...safeParcelData } = parcelData;

    // Naya parcel create karo
    const newParcel = await BookingParcel.create({
        ...safeParcelData, // Sirf mehfooz data istemal karo
        customerId: customerId, // ID hamesha token se hi lo
        trackingNumber: trackingNumber,
        deliveryCharge: deliveryCharge,
        status: 'pending',
        paymentStatus: 'pending'
    });

   
    try {
        const customer = await User.findByPk(customerId);

        if (customer) {
            // Naya, behtar message
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
 * @param {number} parcelId - The ID of the parcel.
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
 * @param {number} parcelId - The ID of the parcel to be updated.
 * @param {number} agentId - The ID of the agent to be assigned.
 * @returns {object} The updated parcel object.
 */
const assignAgentToParcel = async (parcelId, agentId) => {
    // Step 1: Pehle, parcel ko dhoondo
    const parcel = await db.BookingParcel.findByPk(parcelId);
    if (!parcel) {
        throw new Error("Parcel not found with this ID.");
    }

    // Step 2: Yeh check karo ki parcel pehle se hi assigned to nahi hai
    if (parcel.status !== 'pending') {
        throw new Error(`This parcel cannot be assigned. Its status is already '${parcel.status}'.`);
    }

    // Step 3: Ab, agent ko dhoondo
    const agent = await db.User.findByPk(agentId);
    if (!agent) {
        throw new Error("Agent not found with this ID.");
    }

    // Step 4 (Security Check): Confirm karo ki yeh user asal mein 'agent' hai
    if (agent.role !== 'agent') {
        throw new Error(`User with ID ${agentId} is not a delivery agent.`);
    }

    // Step 5: Agar sab theek hai, to parcel ko update karo
    parcel.agentId = agentId;
    parcel.status = 'scheduled'; // Status ko 'pending' se 'scheduled' kar do

    await parcel.save(); // Badlaav ko database mein save karo

    return parcel;
};

/**
 * Retrieves all parcels assigned to a specific agent.
 * @param {number} agentId - The ID of the logged-in agent.
 * @returns {Array} A list of parcels assigned to the agent.
 */
const getParcelsByAgentId = async (agentId) => {
    const parcels = await db.BookingParcel.findAll({
        where: {
            agentId: agentId
        },
        order: [['createdAt', 'ASC']], // Puraane parcel upar taaki pehle deliver hon
        include: {
            model: db.User,
            as: 'Customer', // Agent ko customer ki details bhi dikhao
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