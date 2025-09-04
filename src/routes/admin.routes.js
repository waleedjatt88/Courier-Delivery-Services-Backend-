const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller.js");

const authController = require("../controllers/auth.controller.js");

const {
  verifyToken,
  isAdmin,
  refreshCookie,
} = require("../middleware/auth.middleware.js");

router.get(
  "/users",
  [verifyToken, isAdmin, refreshCookie],
  adminController.getAllUsers
);
router.delete(
  "/users/:id",
  [verifyToken, isAdmin, refreshCookie],
  adminController.deleteUser
);
router.post(
  "/users",
  [verifyToken, isAdmin, refreshCookie],
  authController.register
);
router.patch(
  "/users/:id",
  [verifyToken, isAdmin, refreshCookie],
  adminController.updateUser
);

router.get(
  "/parcels",
  [verifyToken, isAdmin, refreshCookie],
  adminController.getAllParcels
);
router.get(
  "/parcels/:id",
  [verifyToken, isAdmin, refreshCookie],
  adminController.getParcelById
);

router.patch(
  "/parcels/:id/assign",
  [verifyToken, isAdmin, refreshCookie],
  adminController.assignAgent
);

router.patch(
  "/users/:id/block",
  [verifyToken, isAdmin],
  adminController.blockUser
);
router.patch(
  "/users/:id/unblock",
  [verifyToken, isAdmin],
  adminController.unblockUser
);
router.patch(
  "/users/:id/suspend",
  [verifyToken, isAdmin],
  adminController.suspendUser
);
router.patch(
  "/users/:id/unsuspend",
  [verifyToken, isAdmin],
  adminController.unsuspendUser
);

router.get(
  "/tickets",
  [verifyToken, isAdmin, refreshCookie],
  adminController.getAllTickets
);
router
  .route("/tickets/:id")
  .get([verifyToken, isAdmin, refreshCookie], adminController.getTicketById)
  .patch(
    [verifyToken, isAdmin, refreshCookie],
    adminController.updateTicketStatus
  );

router.get('/pricing', [verifyToken, isAdmin, refreshCookie], adminController.getPricingRules);
router.patch('/pricing/:id', [verifyToken, isAdmin, refreshCookie], adminController.updatePricingRule);

router.patch('/parcels/:id/cancel', [verifyToken, isAdmin, refreshCookie], adminController.cancelParcel);
router.patch('/parcels/:id/reschedule', [verifyToken, isAdmin, refreshCookie], adminController.rescheduleParcel);


module.exports = router;
