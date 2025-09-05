
const parcelService = require("../services/parcel.service.js");


const prepareCheckout = async (req, res) => {
  try {
    const parcelData = req.body;

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

    const newParcel = await parcelService.createParcel(parcelData, customerId);

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

const confirmCodBooking = async (req, res) => {
    try {
        const customerId = req.user.id; 
        const parcelId = req.params.id; 

        const confirmedParcel = await parcelService.confirmCodBooking(parcelId, customerId);

        res.status(200).json({ 
            message: "Your COD order has been confirmed successfully!", 
            parcel: confirmedParcel 
        });

    } catch (error) {
        if (error.message.includes("Invalid parcel")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Failed to confirm COD order." });
    }
};



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

const getParcelFiles = async (req, res) => {
    try {
        const customerId = req.user.id;
        const parcelId = req.params.id;
        const files = await parcelService.getParcelFiles(parcelId, customerId);
        res.status(200).json({ files: files });
    } catch (error) {
      
    }
};


module.exports = {
  prepareCheckout,
  confirmCodBooking,
  getMyParcels, 
  getParcelFiles
};
