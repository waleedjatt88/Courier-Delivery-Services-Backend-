const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller.js");
const authController = require("../controllers/auth.controller.js");
const staticPageController = require('../controllers/static-page.controller.js');


const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth.middleware.js");

router.get("/users", [verifyToken, isAdmin], adminController.getAllUsers);
router.delete("/users/:id", [verifyToken, isAdmin], adminController.deleteUser);
router.post("/users", [verifyToken, isAdmin], authController.register);
router.patch("/users/:id", [verifyToken, isAdmin], adminController.updateUser);

router.get("/parcels", [verifyToken, isAdmin], adminController.getAllParcels);
router.get("/parcels/:id", [verifyToken, isAdmin], adminController.getParcelById);
router.patch("/parcels/:id/assign", [verifyToken, isAdmin], adminController.assignAgent);
router.patch("/parcels/:id/cancel", [verifyToken, isAdmin], adminController.cancelParcel);
router.patch("/parcels/:id/reschedule", [verifyToken, isAdmin], adminController.rescheduleParcel);

router.patch("/users/:id/block", [verifyToken, isAdmin], adminController.blockUser);
router.patch("/users/:id/unblock", [verifyToken, isAdmin], adminController.unblockUser);
router.patch("/users/:id/suspend", [verifyToken, isAdmin], adminController.suspendUser);
router.patch("/users/:id/unsuspend", [verifyToken, isAdmin], adminController.unsuspendUser);

router.get("/tickets", [verifyToken, isAdmin], adminController.getAllTickets);
router
  .route("/tickets/:id")
  .get([verifyToken, isAdmin], adminController.getTicketById)
  .patch([verifyToken, isAdmin], adminController.updateTicketStatus);

router.get("/pricing", [verifyToken, isAdmin], adminController.getPricingRules);
router.patch("/pricing/:id", [verifyToken, isAdmin], adminController.updatePricingRule);
router.get('/pricing/commission/agent', [verifyToken, isAdmin], adminController.getAgentCommission);
router.patch('/pricing/commission/agent', [verifyToken, isAdmin], adminController.updateAgentCommission);

router.get("/static-pages", [verifyToken, isAdmin], staticPageController.getAllStaticPages);
router.post("/static-pages", [verifyToken, isAdmin], staticPageController.createStaticPage);
router.get("/static-pages/:pageType", [verifyToken, isAdmin], staticPageController.getStaticPageByType);
router.patch("/static-pages/:pageType", [verifyToken, isAdmin], staticPageController.updateStaticPage);
router.delete("/static-pages/:pageType", [verifyToken, isAdmin], staticPageController.deleteStaticPage);


router.get('/stats/agents', [verifyToken, isAdmin], adminController.getAgentStats);
router.get('/stats/global', [verifyToken, isAdmin], adminController.getGlobalStats);
router.get('/stats/performance', [verifyToken, isAdmin], adminController.getOverallPerformanceStats);


router.post("/manual-orders/prepare", [verifyToken, isAdmin], adminController.prepareManualOrder);
router.patch("/manual-orders/:id/confirm-cash", [verifyToken, isAdmin], adminController.confirmPayNowOrder);
router.post("/manual-orders/:id/send-link", [verifyToken, isAdmin], adminController.sendPaymentLink);

router.patch('/parcels/:id/confirm-cod-payment', [verifyToken, isAdmin], adminController.confirmCodPayment);


module.exports = router;
