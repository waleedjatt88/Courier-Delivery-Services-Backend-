// src/routes/parcel.routes.js

const express = require('express');
const router = express.Router();
const parcelController = require('../controllers/parcel.controller.js');
const { verifyToken, refreshCookie } = require('../middleware/auth.middleware.js');

router.post('/', [verifyToken, refreshCookie], parcelController.createParcel);
router.get('/my', [verifyToken, refreshCookie], parcelController.getMyParcels);


module.exports = router;