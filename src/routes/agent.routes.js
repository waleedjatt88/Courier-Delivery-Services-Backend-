// src/routes/agent.routes.js
const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller.js');
const { verifyToken, isAgent, refreshCookie } = require('../middleware/auth.middleware.js');

// Route for an agent to get their own assigned parcels
// Final URL: GET /api/agent/parcels
router.get('/parcels', [verifyToken, isAgent, refreshCookie], agentController.getMyAssignedParcels);

router.get('/parcels/:id', [verifyToken, isAgent, refreshCookie], agentController.getMyParcelDetails);

module.exports = router;