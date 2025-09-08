
const express = require('express');
const router = express.Router();
const parcelController = require('../controllers/parcel.controller.js');
const { verifyToken, refreshCookie } = require('../middleware/auth.middleware.js');

router.post('/prepareCheckout', [verifyToken, refreshCookie], parcelController.prepareCheckout);
router.get('/my', [verifyToken, refreshCookie], parcelController.getMyParcels);

router.get('/:id/files', [verifyToken, refreshCookie], parcelController.getParcelFiles);
router.patch('/:id/confirm-cod', [verifyToken, refreshCookie], parcelController.confirmCodBooking);



module.exports = router;