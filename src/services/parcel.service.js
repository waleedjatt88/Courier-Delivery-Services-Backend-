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
            
            const message = `
Hello ${customer.fullName},

Your parcel has been successfully booked!

Here are your details:
- Tracking Number: ${newParcel.trackingNumber}
- Pickup Address: ${newParcel.pickupAddress}
- Delivery Address: ${newParcel.deliveryAddress}
- Total Charges: Rs. ${newParcel.deliveryCharge}

You can track your parcel's status on our website using the tracking number.

Thank you for using our service!
            `;

            // 3. Email bhejo
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

module.exports = {
    createParcel,
    getMyParcels,
    getAllParcels,
    getParcelById 
};