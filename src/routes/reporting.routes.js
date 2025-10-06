
const express = require('express');
const router = express.Router();
const reportingController = require('../controllers/reporting.controller.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware.js');



router.get('/stats/bookings', [verifyToken, isAdmin], reportingController.getBookingStats);
router.get('/reports/delivered-parcels', [verifyToken, isAdmin], reportingController.getParcelsReport);
router.get('/stats/revenue', [verifyToken, isAdmin], reportingController.getRevenueStats);
router.get('/reports/all-users-fraud', [verifyToken, isAdmin], reportingController.getAllUsersFraudReport);


module.exports = router;