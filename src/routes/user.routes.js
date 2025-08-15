// src/routes/user.routes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller.js');
const { verifyToken, refreshCookie } = require('../middleware/auth.middleware.js'); // isAdmin ki zaroorat nahi

router.get('/:id', [verifyToken, refreshCookie], userController.getUserById);
router.patch('/:id', [verifyToken, refreshCookie], userController.updateUser);
router.put('/:id', [verifyToken, refreshCookie], userController.updateUser);
router.delete('/me', [verifyToken, refreshCookie], userController.deleteMyProfile);


module.exports = router;