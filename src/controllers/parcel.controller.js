
const parcelService = require("../services/parcel.service.js");


const createParcel = async (req, res) => {
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
  createParcel,
  getMyParcels, 
  getParcelFiles
};
