const db = require('../../models');
const { BookingParcel } = db;

const getTrackingStatus = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    if (!trackingNumber) {
      return res.status(400).json({
        error: 'Tracking number is required'
      });
    }
    const parcel = await BookingParcel.findOne({
      where: { trackingNumber: trackingNumber },
      attributes: [
        'trackingNumber',
        'status',
        'pickupAddress',
        'deliveryAddress',
        'paymentMethod',
        'deliveryCharge',
        'deliveryType',
        'packageWeight',
        'packageSize',
      ]
    });
    if (!parcel) {
      return res.status(404).json({
        error: 'Tracking number not found',
        message: 'Please check your tracking number and try again'
      });
    }
    
    res.status(200).json({
      trackingNumber: parcel.trackingNumber,
      
      status: (parcel.status === 'scheduled') ? 'order_placed' : parcel.status,
      
      pickupAddress: parcel.pickupAddress,
      deliveryAddress: parcel.deliveryAddress,
        paymentMethod: parcel.paymentMethod,
        deliveryCharge: parcel.deliveryCharge,
        deliveryType: parcel.deliveryType,
        packageWeight: parcel.packageWeight,
        packageSize: parcel.packageSize,
    });

  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to fetch tracking information'
    });
  }
};

module.exports = {
  getTrackingStatus
};