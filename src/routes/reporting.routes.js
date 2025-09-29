
const express = require('express');
const router = express.Router();
const reportingController = require('../controllers/reporting.controller.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware.js');



router.get('/stats/bookings', [verifyToken, isAdmin], reportingController.getBookingStats);

module.exports = router;