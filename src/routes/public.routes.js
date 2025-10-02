const express = require('express');
const router = express.Router();
const pageController = require('../controllers/page.controller.js');
const trackingController = require('../controllers/tracking.controller.js');



router.get('/pages/:slug', pageController.getPage);

router.get('/track/:trackingNumber', trackingController.getTrackingStatus);

module.exports = router;
