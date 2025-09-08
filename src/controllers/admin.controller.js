
const adminService = require('../services/admin.service.js');
const parcelService = require('../services/parcel.service.js');
const ticketService = require('../services/ticket.service.js'); 
const pricingService = require('../services/pricing.service.js'); 
const reportingService = require('../services/reporting.service.js');




const getAllUsers = async (req, res) => {
    try {
        const users = await adminService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        await adminService.deleteUser(req.params.id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        if (error.message.includes("User not found")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

 
const getAllParcels = async (req, res) => {
    try {
        const parcels = await parcelService.getAllParcels();
        res.status(200).json({ parcels: parcels });
    } catch (error) {
        console.error("Admin: Error fetching all parcels:", error);
        res.status(500).json({ message: "Failed to fetch parcels." });
    }
};




const getParcelById = async (req, res) => {
    try {
        const parcelId = req.params.id;
        const parcel = await parcelService.getParcelById(parcelId);
        
        if (!parcel) {
            return res.status(404).json({ message: "Parcel not found." });
        }

        res.status(200).json({ parcel: parcel });
    } catch (error) {
        console.error("Admin: Error fetching parcel by ID:", error);
        res.status(500).json({ message: "Failed to fetch parcel." });
    }
};

const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = req.body;
        const updatedUser = await adminService.updateUser(userId, updateData);
        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        if (error.message.includes("User not found")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Server error: " + error.message });
    }
};


const assignAgent = async (req, res) => {
    try {
        const parcelId = req.params.id; 
        const { agentId } = req.body; 

        if (!agentId) {
            return res.status(400).json({ message: "Agent ID is required in the body." });
        }

        const updatedParcel = await parcelService.assignAgentToParcel(parcelId, agentId);

        res.status(200).json({
            message: `Agent ${agentId} has been assigned to parcel ${parcelId}.`,
            parcel: updatedParcel
        });

    } catch (error) {
        if (error.message.includes("not found")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: "Assignment failed: " + error.message });
    }
};


const blockUser = async (req, res) => {
    try {
        const user = await adminService.blockUser(req.params.id);
        res.status(200).json({ message: `User ${user.fullName} has been blocked.`, user });
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const unblockUser = async (req, res) => {
    try {
        const user = await adminService.unblockUser(req.params.id);
        res.status(200).json({ message: `User ${user.fullName} has been unblocked.`, user });
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const suspendUser = async (req, res) => {
    try {
        const { days } = req.body; 
        const user = await adminService.suspendUser(req.params.id, days);
        res.status(200).json({ message: `User ${user.fullName} has been suspended for ${days} days.`, user });
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const unsuspendUser = async (req, res) => {
    try {
        const user = await adminService.unsuspendUser(req.params.id);
        res.status(200).json({ message: `User ${user.fullName} has been unsuspended.`, user });
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const getAllTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getAllTickets();
        res.status(200).json({ tickets });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch tickets." });
    }
};

const getTicketById = async (req, res) => {
    try {
        const ticket = await ticketService.getTicketById(req.params.id);
        res.status(200).json({ ticket });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await ticketService.updateTicketStatus(req.params.id, status);
        res.status(200).json({ message: "Ticket status updated.", ticket });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getPricingRules = async (req, res) => {
    try {
        const rules = await pricingService.getAllPricingRules();
        res.status(200).json({ pricingRules: rules });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch pricing rules." });
    }
};

const updatePricingRule = async (req, res) => {
    try {
        const ruleId = req.params.id; 
        const updateData = req.body; 
        const updatedRule = await pricingService.updatePricingRule(ruleId, updateData);
        res.status(200).json({ message: "Pricing rule updated successfully.", rule: updatedRule });
    } catch (error) {
        if (error.message.includes("not found")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: "Update failed: " + error.message });
    }
};

const cancelParcel = async (req, res) => {
    try {
        const parcelId = req.params.id;
        const updatedParcel = await parcelService.cancelParcelByAdmin(parcelId);

        res.status(200).json({
            message: `Parcel ${updatedParcel.trackingNumber} has been cancelled.`,
            parcel: updatedParcel
        });

    } catch (error) {
        if (error.message.includes("not found")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: "Cancellation failed: " + error.message });
    }
};

const rescheduleParcel = async (req, res) => {
    try {
        const parcelId = req.params.id;
        const updatedParcel = await parcelService.rescheduleParcelByAdmin(parcelId);

        res.status(200).json({
            message: `Parcel ${updatedParcel.trackingNumber} has been rescheduled. Please assign an agent.`,
            parcel: updatedParcel
        });

    } catch (error) {
        if (error.message.includes("not found")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: "RescheduleParcel failed: " + error.message });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const stats = await reportingService.getDashboardStats(req.query.period || 'daily');
        res.status(200).json(stats);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getAgentPerformance = async (req, res) => {
    try {
        const performance = await reportingService.getAgentPerformance(req.params.id);
        res.status(200).json(performance);
    } catch (error) { res.status(500).json({ message: error.message }); }
};


module.exports = {
    getAllUsers,
    deleteUser,
    getAllParcels,
    getParcelById,
    updateUser,
    assignAgent ,
    blockUser,
    unblockUser,
    suspendUser,
    unsuspendUser,
    getAllTickets,
    getTicketById,
    updateTicketStatus,
    getPricingRules,
    updatePricingRule,
    cancelParcel,
    rescheduleParcel,
    getDashboardStats,
    getAgentPerformance

};