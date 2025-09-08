const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller.js');
const { verifyToken, isAgent, refreshCookie } = require('../middleware/auth.middleware.js');

router.get('/parcels', [verifyToken, isAgent, refreshCookie], agentController.getMyAssignedParcels);
router.get('/parcels/:id', [verifyToken, isAgent, refreshCookie], agentController.getMyParcelDetails);
router.patch('/parcels/:id/status', [verifyToken, isAgent], agentController.updateParcelStatus);


router.patch('/parcels/:id/accept', [verifyToken, isAgent, refreshCookie], agentController.acceptJob);
router.patch('/parcels/:id/reject', [verifyToken, isAgent, refreshCookie], agentController.rejectJob);

router.get('/earnings', [verifyToken, isAgent, refreshCookie], agentController.getMyEarnings);

module.exports = router;