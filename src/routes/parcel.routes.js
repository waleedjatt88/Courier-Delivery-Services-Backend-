const express = require('express');
const router = express.Router();
const parcelController = require('../controllers/parcel.controller.js');
const { verifyToken } = require('../middleware/auth.middleware.js');


router.post('/prepareCheckout', verifyToken, parcelController.prepareCheckout);

router.get('/my', verifyToken, parcelController.getMyParcels);

router.get('/:id/files', verifyToken, parcelController.getParcelFiles);

router.patch('/:id/confirm-cod', verifyToken, parcelController.confirmCodBooking);

module.exports = router;
