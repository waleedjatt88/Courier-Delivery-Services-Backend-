const parcelService = require('../services/parcel.service.js');
const reportingService = require('../services/reporting.service.js'); 

const getMyAssignedParcels = async (req, res) => {
    try {
        const agentId = req.user.id;
        const parcels = await parcelService.getParcelsByAgentId(agentId);
        res.status(200).json({ parcels });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch assigned parcels.' });
    }
};

const getMyParcelDetails = async (req, res) => {
    try {
        const agentId = req.user.id; 
        const parcelId = req.params.id; 

        const parcel = await parcelService.getParcelById(parcelId);

        if (!parcel) {
            return res.status(404).json({ message: "Parcel not found." });
        }

        
        if (parcel.agentId !== agentId) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to view this parcel." });
        }
        

        res.status(200).json({ parcel });

    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch parcel details.' });
    }
};

const acceptJob = async (req, res) => {
    try {
        const parcel = await parcelService.acceptJobByAgent(req.params.id, req.user.id);
        res.status(200).json({ message: "Job accepted successfully.", parcel });
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const rejectJob = async (req, res) => {
    try {
        const { reason } = req.body;
        const parcel = await parcelService.rejectJobByAgent(req.params.id, req.user.id, reason);
        res.status(200).json({ message: "Job rejected.", parcel });
    } catch (error) { res.status(400).json({ message: error.message }); }
};


const getMyEarnings = async (req, res) => {
    try {
        const agentId = req.user.id;
        const period = req.query.period || 'daily';
        
        const earnings = await reportingService.getAgentEarnings(agentId, period);
        res.status(200).json(earnings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch earnings.' });
    }
};

const updateParcelStatus = async (req, res) => {
    try {
        const parcel = await parcelService.updateParcelStatusByAgent(
            req.params.id,
            req.user.id,
            req.body.status
        );
        res.status(200).json({ message: "Status updated successfully.", parcel });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getMyAssignedParcels,
    getMyParcelDetails ,
    acceptJob,
    rejectJob,
    getMyEarnings,
    updateParcelStatus
};