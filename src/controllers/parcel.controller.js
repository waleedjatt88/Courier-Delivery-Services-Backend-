// src/controllers/parcel.controller.js

const parcelService = require("../services/parcel.service.js");

/**
 * Controller to handle new parcel booking.
 */
const createParcel = async (req, res) => {
  try {
    // Step 1: Frontend se body mein parcel ka data lo
    const parcelData = req.body;

    // Step 2: Logged-in user ki ID token se nikalo (yeh verifyToken se aati hai)
    const customerId = req.user.id;

    if (
      !parcelData.pickupAddress ||
      !parcelData.deliveryAddress ||
      !parcelData.packageWeight
    ) {
      return res
        .status(400)
        .json({
          message:
            "Pickup address, delivery address, and package weight are required.",
        });
    }

    // Step 3: Service ko call karo aur data pass karo
    const newParcel = await parcelService.createParcel(parcelData, customerId);

    // Step 4: Kamyabi ka response bhejo
    res
      .status(201)
      .json({ message: "Parcel booked successfully!", parcel: newParcel });
  } catch (error) {
    console.error("Error booking parcel:", error);
    res
      .status(500)
      .json({ message: "Failed to book parcel.", error: error.message });
  }
};

/**
 * Controller to get all parcels for the logged-in customer.
 */
const getMyParcels = async (req, res) => {
  try {
    const customerId = req.user.id;
    const parcels = await parcelService.getMyParcels(customerId);
    res.status(200).json({ parcels });
  } catch (error) {
    console.error("Error fetching parcels:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch parcels.", error: error.message });
  }
};

module.exports = {
  createParcel,
  getMyParcels, 
};
