'use strict';

const getPakistanTime = () => {
    const now = new Date();
    const pakistanOffset = 5 * 60; 
    const localOffset = now.getTimezoneOffset();
    const diff = (pakistanOffset + localOffset) * 60 * 1000;
    const pakistanTime = new Date(now.getTime() + diff);
    console.log(`[Timezone Fixed to Asia/Karachi] Local Time: ${pakistanTime}`);
    return pakistanTime;
};

const validatePickupSlot = (pickupSlot) => {
    try {
        if (!pickupSlot || typeof pickupSlot !== "string") {
            throw new Error("Pickup slot is required in the format 'YYYY-MM-DD, HH:mm to HH:mm'.");
        }

        const match = pickupSlot.match(
            /^(\d{4})-(\d{2})-(\d{2}),\s*(\d{2}):(\d{2})\s*to\s*(\d{2}):(\d{2})$/
        );

        if (!match) {
            throw new Error("Invalid pickup slot format. Expected 'YYYY-MM-DD, HH:mm to HH:mm'.");
        }

        const [_, year, month, day, startHour, startMin, endHour, endMin] = match;
        const now = getPakistanTime();

        const dateStr = `${year}-${month}-${day}`;
        const pickupDate = new Date(`${dateStr}T00:00:00`);
        const pickupStart = new Date(`${dateStr}T${startHour}:${startMin}:00`);
        const pickupEnd = new Date(`${dateStr}T${endHour}:${endMin}:00`);

        // 🧩 Step 1: Validate date first
        const endOfDay = new Date(pickupDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (endOfDay < now) {
            throw new Error("Please select a valid pickup date. The selected date must be today or later.");
        }

        const today = getPakistanTime();
        const isToday =
            pickupDate.getDate() === today.getDate() &&
            pickupDate.getMonth() === today.getMonth() &&
            pickupDate.getFullYear() === today.getFullYear();

        // 🕒 Time checks
        if (pickupEnd <= pickupStart) {
            throw new Error("Pickup end time must be after start time.");
        }

        if (isToday) {
            if (pickupEnd <= now) {
                throw new Error("Please select a valid pickup time. Pickup time cannot be before the current time.");
            }

            const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
            if (pickupStart < fifteenMinutesLater) {
                throw new Error("Pickup start time must be at least 15 minutes from now.");
            }
        }

        return true;
    } catch (err) {
        console.error("[Pickup Validation Exception]:", err.message);
        const cleanError = new Error(err.message || "Invalid pickup slot.");
        cleanError.statusCode = 400;
        throw cleanError;
    }
};

module.exports = { validatePickupSlot };
