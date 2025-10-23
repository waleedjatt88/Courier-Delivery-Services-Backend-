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

const convertTo24Hour = (hour, minute, period) => {
    hour = parseInt(hour, 10);
    minute = parseInt(minute, 10);

    if (period) {
        period = period.toLowerCase();
        if (period === "pm" && hour < 12) hour += 12;
        if (period === "am" && hour === 12) hour = 0;
    }
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
};

const validatePickupSlot = (pickupSlot) => {
    try {
        if (!pickupSlot || typeof pickupSlot !== "string") {
            throw new Error("Failed to book parcel, Pickup slot is required in the format 'YYYY-MM-DD, HH:mm (am/pm optional) to HH:mm (am/pm optional)'.");
        }

        const match = pickupSlot.match(
            /^(\d{4})-(\d{2})-(\d{2}),\s*(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?\s*to\s*(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?$/
        );

        if (!match) {
            throw new Error("Failed to book parcel, Invalid pickup slot format. Expected 'YYYY-MM-DD, HH:mm (am/pm optional) to HH:mm (am/pm optional)'.");
        }

        const [_, year, month, day, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = match;
        const now = getPakistanTime();

        const dateStr = `${year}-${month}-${day}`;

        const startTime24 = convertTo24Hour(startHour, startMin, startPeriod);
        const endTime24 = convertTo24Hour(endHour, endMin, endPeriod);

        const pickupDate = new Date(`${dateStr}T00:00:00`);
        const pickupStart = new Date(`${dateStr}T${startTime24}:00`);
        const pickupEnd = new Date(`${dateStr}T${endTime24}:00`);

        const endOfDay = new Date(pickupDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (endOfDay < now) {
            throw new Error("Failed to book parcel, Please select a valid pickup date. The selected date must be today or later.");
        }

        const workStart = new Date(`${dateStr}T08:00:00`);
        const workEnd = new Date(`${dateStr}T20:00:00`);

        const today = getPakistanTime();
        const isToday =
            pickupDate.getDate() === today.getDate() &&
            pickupDate.getMonth() === today.getMonth() &&
            pickupDate.getFullYear() === today.getFullYear();

        if (pickupStart < workStart || pickupEnd > workEnd) {
            throw new Error("Failed to book parcel, Pickup time must be between 8:00 AM and 8:00 PM.");
        }

        if (pickupEnd <= pickupStart) {
            throw new Error("Failed to book parcel,You can’t select a time earlier than the current time. Please choose a valid time.");
        }

        if (isToday) {
            if (pickupEnd <= now) {
                throw new Error("Failed to book parcel, Please select a valid pickup time. Pickup time cannot be before the current time.");
            }

            const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
            if (pickupStart < fifteenMinutesLater) {
                throw new Error("Failed to book parcel, Pickup start time must be at least 15 minutes from now.");
            }
        }

        return true;
    } catch (err) {
        console.error("[Pickup Validation Exception]:", err.message);
        const cleanError = new Error(err.message || "Failed to book parcel, Invalid pickup slot.");
        cleanError.statusCode = 400;
        throw cleanError;
    }
};

module.exports = { validatePickupSlot };
