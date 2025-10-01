const express = require('express');
const router = express.Router();
const weightSlabController = require('../controllers/weightslab.controller.js');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware.js');

router.use(verifyToken, isAdmin);

router.route('/')
    .get(weightSlabController.getAllSlabs)
    .post(weightSlabController.createSlab);

router.route('/:id')
    .patch(weightSlabController.updateSlab)
    .delete(weightSlabController.deleteSlab);

module.exports = router;