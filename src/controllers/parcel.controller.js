const parcelService = require("../services/parcel.service.js");
const fs = require('fs');
const path = require('path');

const prepareCheckout = async (req, res) => {
  try {
    const parcelData = req.body;
    const customerId = req.user.id;

    if (
      !parcelData.pickupAddress ||
      !parcelData.deliveryAddress ||
      !parcelData.packageWeight
    ) {
      return res.status(400).json({
        message:
          "Pickup address, delivery address, and package weight are required.",
      });
    }
    const parcel = await parcelService.prepareCheckout(parcelData, customerId);
    return res.status(201).json({
      message: "Parcel booked successfully!",
      parcel,
    });
  } catch (error) {
    console.error("Error booking parcel:", error);
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({
      message: error.message || "Failed to book parcel.",
    });
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
    const { page, limit } = req.query;
    const result = await parcelService.getMyParcels(customerId, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching customer parcels:", error);
    res.status(500).json({ message: "Failed to fetch parcels." });
  }
};

const getParcelFiles = async (req, res) => {
    try {
        const customerId = req.user.id;
        const parcelId = req.params.id;
        const files = await parcelService.getParcelFiles(parcelId, customerId);
        res.status(200).json({ files: files });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch parcel files.", error: error.message });
    }
};

const cancelParcel = async (req, res) => {
  try {
    const customerId = req.user.id;
    const parcelId = req.params.id; 
    const cancelledParcel = await parcelService.cancelParcelByUser(parcelId, customerId);
    res.status(200).json({
      message: "Parcel has been successfully cancelled.",
      parcel: cancelledParcel,
    });
  } catch (error) {
    if (error.message.includes("not found") || error.message.includes("not authorized")) {
      return res.status(404).json({ message: error.message });
    }
     if (error.message.includes("cannot be cancelled")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error cancelling parcel:", error);
    res.status(500).json({ message: "Failed to cancel parcel.", error: error.message });
  }
};

const getInvoice = async (req, res) => {
  try {
    const parcelId = req.params.id;
    const user = req.user;
    const { type } = req.query;
    const relativePath = await parcelService.getInvoicePathForUser(parcelId, user, type);
    const fullPath = path.join(__dirname, '../../public', relativePath);
    if (fs.existsSync(fullPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice-${parcelId}.pdf"`);
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
    } else {
      res.status(404).json({ message: 'Invoice file not found on server.' });
    }
  } catch (error) {
    if (error.message.includes("not found") || error.message.includes("not authorized") || error.message.includes("must be specified")) {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to retrieve invoice.', error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const customerId = req.user.id;
    const stats = await parcelService.getCustomerDashboardStats(customerId);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats." });
  }
};

module.exports = {
  prepareCheckout,
  confirmCodBooking,
  getMyParcels, 
  getParcelFiles,
  cancelParcel,
  getInvoice,
  getDashboardStats,
};
