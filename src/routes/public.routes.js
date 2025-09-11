const express = require('express');
const router = express.Router();
const staticPageController = require('../controllers/static-page.controller.js');
const trackingController = require('../controllers/tracking.controller.js');

router.get('/static-pages', staticPageController.getAllStaticPages);
router.get('/static-pages/:pageType', staticPageController.getStaticPageByType);

router.get('/track/:trackingNumber', trackingController.getTrackingStatus);

module.exports = router;
