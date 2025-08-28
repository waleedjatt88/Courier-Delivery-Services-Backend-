
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller.js');
const { verifyToken, refreshCookie } = require('../middleware/auth.middleware.js');

router.post('/', [verifyToken, refreshCookie], ticketController.createTicket);

module.exports = router;