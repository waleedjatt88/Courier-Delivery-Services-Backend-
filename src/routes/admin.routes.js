
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller.js');


const authController = require('../controllers/auth.controller.js');

const { verifyToken, isAdmin, refreshCookie } = require('../middleware/auth.middleware.js');


router.get('/users', [verifyToken, isAdmin, refreshCookie], adminController.getAllUsers);
router.delete('/users/:id', [verifyToken, isAdmin, refreshCookie], adminController.deleteUser);
router.post('/users', [verifyToken, isAdmin, refreshCookie], authController.register);
router.patch('/users/:id', [verifyToken, isAdmin, refreshCookie], adminController.updateUser);


router.get('/parcels', [verifyToken, isAdmin, refreshCookie], adminController.getAllParcels);
router.get('/parcels/:id', [verifyToken, isAdmin, refreshCookie], adminController.getParcelById);


router.patch('/parcels/:id/assign', [verifyToken, isAdmin, refreshCookie], adminController.assignAgent);



module.exports = router;