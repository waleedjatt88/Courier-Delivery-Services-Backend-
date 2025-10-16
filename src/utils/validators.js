'use strict';

const validatePickupSlot = (pickupDate, pickupTime) => {
    if (!pickupDate || !pickupTime) {
        throw new Error("Pickup date and time are required for scheduled delivery.");
    }
    
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}:00`);
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pickupDay = new Date(pickupDate);
    pickupDay.setHours(0, 0, 0, 0);

    if (pickupDay < today) {
        throw new Error("Pickup date cannot be in the past.");
    }

    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    if (pickupDay.getTime() === today.getTime() && pickupDateTime < fifteenMinutesFromNow) {
        throw new Error("Pickup time must be at least 15 minutes in the future for same-day scheduling.");
    }
};

module.exports = {
    validatePickupSlot
};