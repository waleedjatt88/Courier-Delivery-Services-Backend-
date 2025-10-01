
const reportingService = require('../services/reporting.service.js');

const getBookingStats = async (req, res) => {
    try {
        const { period } = req.query;
        if (!period || !['daily', 'monthly', 'yearly'].includes(period)) {
            return res.status(400).json({ message: "Invalid or missing 'period' query parameter. Use 'daily', 'monthly', or 'yearly'." });
        }
        const stats = await reportingService.getBookingStats(period);
        res.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching booking stats:", error);
        res.status(500).json({ message: "Failed to fetch booking stats.", error: error.message });
    }
};

const getParcelsReport = async (req, res) => {
    try {
        const reportData = await reportingService.generateParcelsReport();
        res.status(200).json(reportData);
    } catch (error) {
        console.error("Error generating parcels report:", error);
        res.status(500).json({ message: "Failed to generate parcels report." });
    }
};

const getRevenueStats = async (req, res) => {
    try {
        const stats = await reportingService.getRevenueStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error("Error generating revenue stats:", error);
        res.status(500).json({ message: "Failed to generate revenue statistics." });
    }
};

module.exports = {
    getBookingStats,
    getParcelsReport,
    getRevenueStats
};