const express = require('express');
const router = express.Router();
const pageController = require('../controllers/page.controller.js');
const trackingController = require('../controllers/tracking.controller.js');



router.get('/pages', pageController.getAllPublicPages);

router.get('/track/:trackingNumber', trackingController.getTrackingStatus);

module.exports = router;
