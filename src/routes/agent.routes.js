const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller.js');
const { verifyToken, isAgent } = require('../middleware/auth.middleware.js');

router.get('/parcels', [verifyToken, isAgent], agentController.getMyAssignedParcels);
router.get('/parcels/:id', [verifyToken, isAgent], agentController.getMyParcelDetails);

router.get('/my-tasks', [verifyToken, isAgent], agentController.getMyTasks);
router.patch('/parcels/:id/status', [verifyToken, isAgent], agentController.updateParcelStatus);
router.patch('/parcels/:id/accept', [verifyToken, isAgent], agentController.acceptJob);
router.patch('/parcels/:id/reject', [verifyToken, isAgent], agentController.rejectJob);

router.get('/my-commission', [verifyToken, isAgent], agentController.getMyCommission);


module.exports = router;
