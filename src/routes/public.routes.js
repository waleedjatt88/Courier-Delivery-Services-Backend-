const express = require('express');
const router = express.Router();
const staticPageController = require('../controllers/static-page.controller.js');

router.get('/static-pages', staticPageController.getAllStaticPages);
router.get('/static-pages/:pageType', staticPageController.getStaticPageByType);

module.exports = router;