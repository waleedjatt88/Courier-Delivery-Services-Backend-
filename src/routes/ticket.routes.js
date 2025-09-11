const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller.js');
const { verifyToken } = require('../middleware/auth.middleware.js');

router.post('/', verifyToken, ticketController.createTicket);

module.exports = router;
